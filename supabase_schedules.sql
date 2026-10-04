-- ==============================================================================
-- USICK AI SCHEDULE — Supabase Database Migration
-- Mendukung Akun Terdaftar Maupun Mode Tamu + Pengingat Otomatis 24/7 di Cloud
-- ==============================================================================

-- 1. Buat Tabel public.schedules
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
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

-- Jika tabel sebelumnya sudah ada dan user_id NOT NULL, lepaskan batasan agar mendukung mode tamu
ALTER TABLE public.schedules ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_user_id_fkey;

-- Indeks untuk kecepatan query dan per-user isolation
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date_time ON public.schedules(date, time);
CREATE INDEX IF NOT EXISTS idx_schedules_reminder_status ON public.schedules(reminder_status, status);

-- Row Level Security (RLS)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: User login dapat melihat jadwal miliknya, dan jadwal berstatus upcoming untuk reminder
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
CREATE POLICY "Users can view their own schedules"
  ON public.schedules FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR user_id IS NULL
    OR (status = 'upcoming' AND reminder_status != 'sent')
  );

-- 2. INSERT Policy: User dapat menambahkan jadwal (baik login maupun tamu)
DROP POLICY IF EXISTS "Users can insert their own schedules" ON public.schedules;
CREATE POLICY "Users can insert their own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
    OR auth.uid() IS NULL
  );

-- 3. UPDATE Policy: User dapat mengupdate jadwal miliknya atau status pengingat
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
CREATE POLICY "Users can update their own schedules"
  ON public.schedules FOR UPDATE
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR (status = 'upcoming')
  )
  WITH CHECK (true);

-- 4. DELETE Policy: User dapat menghapus jadwal miliknya
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;
CREATE POLICY "Users can delete their own schedules"
  ON public.schedules FOR DELETE
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- 5. RPC Functions (Security Definer): Akses aman untuk background reminder worker (Cron / GitHub Actions)
CREATE OR REPLACE FUNCTION get_due_reminders()
RETURNS SETOF public.schedules
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.schedules
  WHERE status = 'upcoming'
    AND reminder_status != 'sent';
$$;

CREATE OR REPLACE FUNCTION mark_reminder_sent(schedule_id UUID, new_status TEXT DEFAULT 'sent')
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.schedules
  SET reminder_status = new_status,
      updated_at = timezone('utc'::text, now())
  WHERE id = schedule_id;
$$;

GRANT EXECUTE ON FUNCTION get_due_reminders() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_reminder_sent(UUID, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- 6. JADWAL OTOMATIS CLOUD (pg_cron + pg_net) — BERJALAN SETIAP 1 MENIT 24/7
-- Fitur ini memastikan pengingat email PASTI terkirim otomatis di cloud
-- meskipun browser ditutup, tab dihapus, atau laptop dimatikan!
-- ==============================================================================

-- Aktifkan ekstensi pg_net (HTTP client) dan pg_cron (Scheduler) jika didukung project
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Bersihkan job lama jika sudah terdaftar agar tidak duplikasi
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'usick_schedule_reminder_job') THEN
    PERFORM cron.unschedule('usick_schedule_reminder_job');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Abaikan jika schema cron belum tersedia
END $$;

-- Daftarkan cron job otomatis setiap 1 menit memanggil endpoint pengingat Vercel
DO $$
BEGIN
  PERFORM cron.schedule(
    'usick_schedule_reminder_job',
    '* * * * *',
    $cron$
      SELECT net.http_post(
        url := 'https://filius-ai.vercel.app/api/schedules/remind',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
      );
    $cron$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron belum aktif di schema. Anda dapat mengaktifkannya via Supabase Project Settings -> Database -> Extensions.';
END $$;
