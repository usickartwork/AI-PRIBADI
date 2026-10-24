-- ============================================================================
-- USICK ONE — MUSIC RECOMMENDATION ENGINE & TASTE PERSISTENCE
-- Additive, idempotent, non-destructive SQL schema migration for Supabase.
-- Does NOT modify or drop any existing tables, columns, or policies.
--
-- Hybrid Compatibility Note:
--   `lib/musicTasteServer.ts` automatically uses `public.music_taste_profiles`
--   and `public.music_listening_events` when this migration has been applied,
--   and seamlessly falls back to `public.user_notes` (`${userId}::music_taste`)
--   if these tables have not yet been created in Supabase.
--
-- Security Model (Zero-Trust Clerk Auth + Supabase Service Role):
--   1. Usick One authenticates users via Clerk (`user_...` string IDs) on the
--      Next.js server (`await auth()`).
--   2. The browser Supabase client (`lib/supabase.ts`) uses the public `anon`
--      key without a Clerk-minted Supabase JWT (`auth.uid()` is NULL).
--   3. Therefore, direct table access from `anon` and `authenticated` roles is
--      REVOKED, RLS is ENABLED, and only the server-side `service_role` client
--      (after verifying Clerk `auth()` in `/api/music/events`,
--      `/api/music/recommendations`, and `/api/music/library`) is permitted
--      to read or write rows.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table: public.music_taste_profiles
-- Stores the compact (< 20 KB), bounded per-account MusicTasteProfileV1 JSONB
-- containing dual-horizon (30d long-term / 48h short-term) artist & genre
-- affinities, per-track completion/skip/replay counters, co-occurrence edges,
-- and idempotent playSessionId ring buffer.
CREATE TABLE IF NOT EXISTS public.music_taste_profiles (
  user_id TEXT PRIMARY KEY,
  version SMALLINT NOT NULL DEFAULT 1,
  profile_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_meaningful_plays INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_music_taste_profiles_updated_at
  ON public.music_taste_profiles (updated_at DESC);

-- 2. Table: public.music_listening_events
-- Stores idempotent, server-verified playback telemetry events keyed by
-- `(user_id, play_session_id)` to prevent multi-device or retry duplication
-- and allow future offline analytics or profile reconstruction.
CREATE TABLE IF NOT EXISTS public.music_listening_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  play_session_id TEXT NOT NULL,
  instance_id TEXT DEFAULT NULL,
  canonical_key TEXT NOT NULL,
  track_id TEXT NOT NULL,
  track_title TEXT NOT NULL,
  primary_artist_key TEXT NOT NULL,
  artist_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  audible_played_ms INTEGER NOT NULL DEFAULT 0,
  track_duration_ms INTEGER NOT NULL DEFAULT 0,
  completion_ratio REAL NOT NULL DEFAULT 0,
  classification TEXT NOT NULL,
  source_context TEXT NOT NULL DEFAULT 'unknown',
  end_reason TEXT NOT NULL,
  is_repeat_one BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_music_listening_events_user_session UNIQUE (user_id, play_session_id)
);

CREATE INDEX IF NOT EXISTS idx_music_listening_events_user_created
  ON public.music_listening_events (user_id, created_at DESC);

-- 3. Enable Row Level Security (RLS) & Revoke Direct Client Table Access
ALTER TABLE public.music_taste_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_listening_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.music_taste_profiles FROM anon, authenticated;
REVOKE ALL ON public.music_listening_events FROM anon, authenticated;
GRANT ALL ON public.music_taste_profiles TO service_role;
GRANT ALL ON public.music_listening_events TO service_role;

-- 4. Install strict `service_role` RLS policies
DO $$
BEGIN
  DROP POLICY IF EXISTS music_taste_profiles_service_role_all ON public.music_taste_profiles;
  CREATE POLICY music_taste_profiles_service_role_all
    ON public.music_taste_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  DROP POLICY IF EXISTS music_listening_events_service_role_all ON public.music_listening_events;
  CREATE POLICY music_listening_events_service_role_all
    ON public.music_listening_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Run manually in Supabase SQL Editor ONLY if rolling back
-- Music Recommendation tables; does NOT affect any existing Usick One tables):
--
-- DROP TABLE IF EXISTS public.music_listening_events;
-- DROP TABLE IF EXISTS public.music_taste_profiles;
-- ============================================================================
