-- ==============================================================================
-- USICK AI SCHEDULE — Supabase Database Migration
-- Strict Account Isolation via user_id & Row Level Security (RLS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  reminder_minutes INTEGER NOT NULL DEFAULT 15,
  recurrence TEXT NOT NULL DEFAULT 'once',
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  status TEXT NOT NULL DEFAULT 'upcoming',
  reminder_status TEXT NOT NULL DEFAULT 'pending',
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks untuk kecepatan query dan per-user isolation
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date_time ON public.schedules(date, time);
CREATE INDEX IF NOT EXISTS idx_schedules_reminder_status ON public.schedules(reminder_status, status);

-- Row Level Security (RLS)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: User hanya dapat melihat schedule miliknya sendiri
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
CREATE POLICY "Users can view their own schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() = user_id);

-- 2. INSERT Policy: User hanya dapat memasukkan schedule dengan user_id miliknya
DROP POLICY IF EXISTS "Users can insert their own schedules" ON public.schedules;
CREATE POLICY "Users can insert their own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE Policy: User hanya dapat mengupdate schedule miliknya
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
CREATE POLICY "Users can update their own schedules"
  ON public.schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. DELETE Policy: User hanya dapat menghapus schedule miliknya
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;
CREATE POLICY "Users can delete their own schedules"
  ON public.schedules FOR DELETE
  USING (auth.uid() = user_id);
