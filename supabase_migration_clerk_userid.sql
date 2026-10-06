-- ==============================================================================
-- MIGRATION: Ubah user_id dari UUID ke TEXT di semua tabel
-- PENTING: Semua RLS Policy yang menggunakan kolom user_id harus di-DROP terlebih
-- dahulu sebelum tipe kolom bisa diubah di PostgreSQL, baru kemudian di-create ulang.
-- ==============================================================================

-- ─── LANGKAH 1: DROP SEMUA POLICY LAMA YANG BERGANTUNG PADA user_id ─────────

-- Schedules policies
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can insert their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- Credit Balances policies
DROP POLICY IF EXISTS "Users can view their own credits" ON public.credit_balances;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.credit_balances;

-- Credit Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON public.credit_transactions;

-- Chat History & Profiles policies (jika sudah ada)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_history') THEN
    DROP POLICY IF EXISTS "Users can view their own chat" ON public.chat_history;
    DROP POLICY IF EXISTS "Users can manage their own chat" ON public.chat_history;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
  END IF;
END $$;


-- ─── LANGKAH 2: ALTER TIPE KOLOM user_id DARI UUID KE TEXT ──────────────────

-- 1. Schedules
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.schedules ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- 2. Subscriptions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.subscriptions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- 3. Credit Balances
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_balances' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.credit_balances ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- 4. Credit Transactions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_transactions' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.credit_transactions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;


-- ─── LANGKAH 3: BUAT TABEL TAMBAHAN JIKA BELUM ADA ──────────────────────────

-- Tabel chat_history
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  messages JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_chat UNIQUE (user_id)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_history' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.chat_history ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- Tabel profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- ─── LANGKAH 4: PASANG KEMBALI RLS POLICIES DENGAN DUKUNGAN TEXT ────────────

-- Schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules"
  ON public.schedules FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid()::TEXT = user_id)
    OR user_id IS NULL
    OR (status = 'upcoming' AND reminder_status != 'sent')
  );

CREATE POLICY "Users can insert their own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (
    auth.uid()::TEXT = user_id
    OR user_id IS NULL
    OR auth.uid() IS NULL
  );

CREATE POLICY "Users can update their own schedules"
  ON public.schedules FOR UPDATE
  USING (
    auth.uid()::TEXT = user_id
    OR user_id IS NULL
    OR (status = 'upcoming')
  )
  WITH CHECK (true);

CREATE POLICY "Users can delete their own schedules"
  ON public.schedules FOR DELETE
  USING (
    auth.uid()::TEXT = user_id
    OR user_id IS NULL
  );

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid()::TEXT = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR ALL
  USING (auth.uid()::TEXT = user_id OR auth.uid() IS NULL);

-- Credit Balances
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON public.credit_balances FOR SELECT
  USING (auth.uid()::TEXT = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own credits"
  ON public.credit_balances FOR ALL
  USING (auth.uid()::TEXT = user_id OR auth.uid() IS NULL);

-- Credit Transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid()::TEXT = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id OR auth.uid() IS NULL);

-- Chat History
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat"
  ON public.chat_history FOR SELECT
  USING (auth.uid()::TEXT = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can manage their own chat"
  ON public.chat_history FOR ALL
  USING (auth.uid()::TEXT = user_id OR auth.uid() IS NULL);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid()::TEXT = id OR auth.uid() IS NULL);

CREATE POLICY "Users can manage their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid()::TEXT = id OR auth.uid() IS NULL);


-- ─── LANGKAH 5: UPDATE RPC deduct_credits DENGAN PARAMETER TEXT ─────────────

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id TEXT,
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
      IF p_credit_type = 'ai' THEN
        SELECT ai_credits INTO v_balance_before FROM public.credit_balances WHERE user_id = p_user_id;
      ELSE
        SELECT code_credits INTO v_balance_before FROM public.credit_balances WHERE user_id = p_user_id;
      END IF;
    END IF;
  END IF;

  IF v_balance_before < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'balance', v_balance_before,
      'requested', p_amount
    );
  END IF;

  v_balance_after := v_balance_before - p_amount;

  IF p_credit_type = 'ai' THEN
    UPDATE public.credit_balances
    SET ai_credits = v_balance_after, updated_at = v_now
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.credit_balances
    SET code_credits = v_balance_after, updated_at = v_now
    WHERE user_id = p_user_id;
  END IF;

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
