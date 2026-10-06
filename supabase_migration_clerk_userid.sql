-- ==============================================================================
-- USICK ONE: MIGRATION CLERK USER_ID (UUID -> TEXT)
-- SCRIPT INI MENGGUNAKAN EXPLICIT CAST (::TEXT) DI SEMUA POLICY SEHINGGA TIDAK
-- MUNGKIN TERJADI ERROR "operator does not exist: text = uuid"
-- ==============================================================================

-- ─── 1. HAPUS FUNGSI YANG MENGUNCI TIPE DATA ─────────────────────────────────
DROP FUNCTION IF EXISTS public.get_due_reminders();
DROP FUNCTION IF EXISTS public.mark_reminder_sent(UUID, TEXT);
DROP FUNCTION IF EXISTS public.mark_reminder_sent(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deduct_credits(UUID, TEXT, INTEGER, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.deduct_credits(TEXT, TEXT, INTEGER, TEXT, TEXT, INTEGER, INTEGER);

-- ─── 2. HAPUS SEMUA RLS POLICY SECARA DINAMIS ────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('schedules', 'subscriptions', 'credit_balances', 'credit_transactions', 'chat_history', 'profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ─── 3. LEPAS FOREIGN KEY CONSTRAINTS JIKA ADA ───────────────────────────────
DO $$
BEGIN
    ALTER TABLE IF EXISTS public.schedules DROP CONSTRAINT IF EXISTS schedules_user_id_fkey;
    ALTER TABLE IF EXISTS public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
    ALTER TABLE IF EXISTS public.credit_balances DROP CONSTRAINT IF EXISTS credit_balances_user_id_fkey;
    ALTER TABLE IF EXISTS public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;
    ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─── 4. UBAH TIPE KOLOM MENJADI TEXT (MENDUKUNG CLERK ID STRING) ─────────────
ALTER TABLE IF EXISTS public.schedules ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE IF EXISTS public.subscriptions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE IF EXISTS public.credit_balances ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE IF EXISTS public.credit_transactions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- ─── 5. PASTIKAN TABEL chat_history & profiles TERSEDIA ──────────────────────
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  messages JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_chat UNIQUE (user_id)
);
ALTER TABLE IF EXISTS public.chat_history ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─── 6. PASANG KEMBALI RLS POLICIES (EXPLICIT ::TEXT PADA KEDUA SISI) ────────
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_select_policy" ON public.schedules FOR SELECT USING ((auth.uid() IS NOT NULL AND auth.uid()::TEXT = user_id::TEXT) OR user_id IS NULL OR (status = 'upcoming' AND reminder_status != 'sent'));
CREATE POLICY "schedules_insert_policy" ON public.schedules FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT OR user_id IS NULL OR auth.uid() IS NULL);
CREATE POLICY "schedules_update_policy" ON public.schedules FOR UPDATE USING (auth.uid()::TEXT = user_id::TEXT OR user_id IS NULL OR (status = 'upcoming')) WITH CHECK (true);
CREATE POLICY "schedules_delete_policy" ON public.schedules FOR DELETE USING (auth.uid()::TEXT = user_id::TEXT OR user_id IS NULL);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_policy" ON public.subscriptions FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);
CREATE POLICY "subscriptions_all_policy" ON public.subscriptions FOR ALL USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);

ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_balances_select_policy" ON public.credit_balances FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);
CREATE POLICY "credit_balances_all_policy" ON public.credit_balances FOR ALL USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_transactions_select_policy" ON public.credit_transactions FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);
CREATE POLICY "credit_transactions_insert_policy" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_history_select_policy" ON public.chat_history FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);
CREATE POLICY "chat_history_all_policy" ON public.chat_history FOR ALL USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (auth.uid()::TEXT = id::TEXT OR auth.uid() IS NULL);
CREATE POLICY "profiles_all_policy" ON public.profiles FOR ALL USING (auth.uid()::TEXT = id::TEXT OR auth.uid() IS NULL);

-- ─── 7. PASANG ULANG FUNGSI RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_due_reminders()
RETURNS SETOF public.schedules LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM public.schedules WHERE status = 'upcoming' AND reminder_status != 'sent';
$$;

CREATE OR REPLACE FUNCTION public.mark_reminder_sent(schedule_id UUID, new_status TEXT DEFAULT 'sent')
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.schedules SET reminder_status = new_status, updated_at = timezone('utc'::text, now()) WHERE id = schedule_id;
$$;

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id TEXT, p_credit_type TEXT, p_amount INTEGER,
  p_model_id TEXT DEFAULT NULL, p_task_type TEXT DEFAULT 'chat',
  p_input_tokens INTEGER DEFAULT NULL, p_output_tokens INTEGER DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_credit_limit INTEGER;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_reset_at TIMESTAMPTZ;
  v_plan TEXT := 'free';
BEGIN
  SELECT ai_credits, code_credits, ai_credit_limit, code_credit_limit, reset_at
  INTO v_balance_before, v_balance_before, v_credit_limit, v_credit_limit, v_reset_at
  FROM public.credit_balances WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.credit_balances (user_id, ai_credits, ai_credit_limit, code_credits, code_credit_limit, reset_at)
    VALUES (p_user_id, 10000, 10000, 50, 50, v_now + interval '30 days')
    RETURNING (CASE WHEN p_credit_type = 'ai' THEN ai_credits ELSE code_credits END),
              (CASE WHEN p_credit_type = 'ai' THEN ai_credit_limit ELSE code_credit_limit END), reset_at
    INTO v_balance_before, v_credit_limit, v_reset_at;
  ELSE
    IF v_now >= v_reset_at THEN
      SELECT plan INTO v_plan FROM public.subscriptions WHERE user_id = p_user_id;
      IF v_plan = 'pro' THEN
        UPDATE public.credit_balances SET ai_credits = 100000, ai_credit_limit = 100000, code_credits = 200, code_credit_limit = 200, reset_at = v_now + interval '30 days', updated_at = v_now WHERE user_id = p_user_id;
        v_balance_before := CASE WHEN p_credit_type = 'ai' THEN 100000 ELSE 200 END;
      ELSE
        UPDATE public.credit_balances SET ai_credits = 10000, ai_credit_limit = 10000, code_credits = 50, code_credit_limit = 50, reset_at = v_now + interval '30 days', updated_at = v_now WHERE user_id = p_user_id;
        v_balance_before := CASE WHEN p_credit_type = 'ai' THEN 10000 ELSE 50 END;
      END IF;
    ELSE
      IF p_credit_type = 'ai' THEN SELECT ai_credits INTO v_balance_before FROM public.credit_balances WHERE user_id = p_user_id;
      ELSE SELECT code_credits INTO v_balance_before FROM public.credit_balances WHERE user_id = p_user_id;
      END IF;
    END IF;
  END IF;

  IF v_balance_before < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'balance', v_balance_before, 'requested', p_amount);
  END IF;

  v_balance_after := v_balance_before - p_amount;
  IF p_credit_type = 'ai' THEN UPDATE public.credit_balances SET ai_credits = v_balance_after, updated_at = v_now WHERE user_id = p_user_id;
  ELSE UPDATE public.credit_balances SET code_credits = v_balance_after, updated_at = v_now WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.credit_transactions (user_id, credit_type, amount, balance_before, balance_after, transaction_type, model_id, task_type, input_tokens, output_tokens, total_tokens, created_at)
  VALUES (p_user_id, p_credit_type, -p_amount, v_balance_before, v_balance_after, 'usage', p_model_id, p_task_type, p_input_tokens, p_output_tokens, (COALESCE(p_input_tokens, 0) + COALESCE(p_output_tokens, 0)), v_now);

  RETURN jsonb_build_object('success', true, 'deducted', p_amount, 'balance_before', v_balance_before, 'balance_after', v_balance_after, 'credit_type', p_credit_type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_due_reminders() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_reminder_sent(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits TO anon, authenticated, service_role;
