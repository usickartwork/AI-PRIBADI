-- ==============================================================================
-- USICK ONE — PRICING & SUBSCRIPTION SYSTEM MIGRATION
-- Mendukung Langganan (Free, Pro, Ultra), AI Credits, Code Credits & Transactions
-- ==============================================================================

-- 1. Tabel Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- 2. Tabel Credit Balances (Terpisah: AI Credits & Code Credits)
CREATE TABLE IF NOT EXISTS public.credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ai_credits INTEGER NOT NULL DEFAULT 10000,
  ai_credit_limit INTEGER NOT NULL DEFAULT 10000,
  code_credits INTEGER NOT NULL DEFAULT 50,
  code_credit_limit INTEGER NOT NULL DEFAULT 50,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '30 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_credits UNIQUE (user_id)
);

-- 3. Tabel Credit Transactions (Audit Log Penggunaan Kredit & Riwayat)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('ai', 'code')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('usage', 'grant', 'reset', 'adjustment', 'refund')),
  model_id TEXT,
  task_type TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks Kecepatan Query
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_balances_user_id ON public.credit_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy Subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Policy Credit Balances
DROP POLICY IF EXISTS "Users can view their own credits" ON public.credit_balances;
CREATE POLICY "Users can view their own credits"
  ON public.credit_balances FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update their own credits" ON public.credit_balances;
CREATE POLICY "Users can update their own credits"
  ON public.credit_balances FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Policy Credit Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can insert transactions" ON public.credit_transactions;
CREATE POLICY "Users can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- ==============================================================================
-- 4. ATOMIC FUNCTION: Pengurangan Kredit Aman (Anti-Race Condition)
-- Menggunakan Row-Level Lock (FOR UPDATE) & Pencegahan Nilai Negatif
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_credit_type TEXT,
  p_amount INTEGER,
  p_model_id TEXT DEFAULT NULL,
  p_task_type TEXT DEFAULT 'chat',
  p_input_tokens INTEGER DEFAULT NULL,
  p_output_tokens INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_credit_limit INTEGER;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_reset_at TIMESTAMPTZ;
  v_plan TEXT := 'free';
BEGIN
  -- Pastikan record balance ada dengan locking
  SELECT ai_credits, code_credits, ai_credit_limit, code_credit_limit, reset_at
  INTO v_balance_before, v_balance_before, v_credit_limit, v_credit_limit, v_reset_at
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Jika belum ada saldo, inisialisasi default
  IF NOT FOUND THEN
    INSERT INTO public.credit_balances (user_id, ai_credits, ai_credit_limit, code_credits, code_credit_limit, reset_at)
    VALUES (p_user_id, 10000, 10000, 50, 50, v_now + interval '30 days')
    RETURNING (CASE WHEN p_credit_type = 'ai' THEN ai_credits ELSE code_credits END),
              (CASE WHEN p_credit_type = 'ai' THEN ai_credit_limit ELSE code_credit_limit END),
              reset_at
    INTO v_balance_before, v_credit_limit, v_reset_at;
  ELSE
    -- Jika sudah lewat waktu reset, perbarui siklus baru (tanpa carry-over)
    IF v_now >= v_reset_at THEN
      SELECT plan INTO v_plan FROM public.subscriptions WHERE user_id = p_user_id;
      IF v_plan = 'pro' THEN
        UPDATE public.credit_balances
        SET ai_credits = 100000, ai_credit_limit = 100000,
            code_credits = 200, code_credit_limit = 200,
            reset_at = v_now + interval '30 days',
            updated_at = v_now
        WHERE user_id = p_user_id;
        v_balance_before := CASE WHEN p_credit_type = 'ai' THEN 100000 ELSE 200 END;
      ELSE
        UPDATE public.credit_balances
        SET ai_credits = 10000, ai_credit_limit = 10000,
            code_credits = 50, code_credit_limit = 50,
            reset_at = v_now + interval '30 days',
            updated_at = v_now
        WHERE user_id = p_user_id;
        v_balance_before := CASE WHEN p_credit_type = 'ai' THEN 10000 ELSE 50 END;
      END IF;
    ELSE
      -- Ambil saldo sesuai jenis kredit
      IF p_credit_type = 'ai' THEN
        SELECT ai_credits INTO v_balance_before FROM public.credit_balances WHERE user_id = p_user_id;
      ELSE
        SELECT code_credits INTO v_balance_before FROM public.credit_balances WHERE user_id = p_user_id;
      END IF;
    END IF;
  END IF;

  -- Cek kecukupan saldo
  IF v_balance_before < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'balance', v_balance_before,
      'requested', p_amount
    );
  END IF;

  -- Hitung saldo baru
  v_balance_after := v_balance_before - p_amount;

  -- Update saldo di tabel
  IF p_credit_type = 'ai' THEN
    UPDATE public.credit_balances
    SET ai_credits = v_balance_after, updated_at = v_now
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.credit_balances
    SET code_credits = v_balance_after, updated_at = v_now
    WHERE user_id = p_user_id;
  END IF;

  -- Catat transaksi audit
  INSERT INTO public.credit_transactions (
    user_id, credit_type, amount, balance_before, balance_after,
    transaction_type, model_id, task_type, input_tokens, output_tokens, total_tokens, created_at
  )
  VALUES (
    p_user_id, p_credit_type, -p_amount, v_balance_before, v_balance_after,
    'usage', p_model_id, p_task_type, p_input_tokens, p_output_tokens,
    (COALESCE(p_input_tokens, 0) + COALESCE(p_output_tokens, 0)), v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'deducted', p_amount,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'credit_type', p_credit_type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_credits TO anon, authenticated, service_role;
