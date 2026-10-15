-- ==============================================================================
-- USICK AI SCHEDULE — Google Calendar Integration Migration
-- Tabel Token Google Calendar Pengguna & Kolom Sinkronisasi Schedules
-- ==============================================================================

-- 1. Tambah Kolom Google Calendar ke Tabel schedules (Jika Belum Ada)
ALTER TABLE IF EXISTS public.schedules
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS google_sync_status TEXT DEFAULT 'disconnected',
  ADD COLUMN IF NOT EXISTS google_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_schedules_google_event_id ON public.schedules(google_event_id);

-- 2. Buat Tabel Penyimpanan Token Google Calendar (Per-User)
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  user_id TEXT PRIMARY KEY,
  google_email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON public.google_calendar_tokens(user_id);

-- 3. Row Level Security (RLS) untuk Keamanan Tingkat Baris
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya dapat melihat dan mengelola token miliknya sendiri
DROP POLICY IF EXISTS "google_tokens_select_policy" ON public.google_calendar_tokens;
CREATE POLICY "google_tokens_select_policy"
  ON public.google_calendar_tokens FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid()::TEXT = user_id::TEXT)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "google_tokens_all_policy" ON public.google_calendar_tokens;
CREATE POLICY "google_tokens_all_policy"
  ON public.google_calendar_tokens FOR ALL
  USING (
    (auth.uid() IS NOT NULL AND auth.uid()::TEXT = user_id::TEXT)
    OR auth.role() = 'service_role'
  );

GRANT ALL ON public.google_calendar_tokens TO anon, authenticated, service_role;

