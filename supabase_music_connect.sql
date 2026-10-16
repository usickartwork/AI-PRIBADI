-- ============================================================================
-- USICK ONE — MUSIC CONNECT (MULTI-DEVICE PLAYBACK & DEVICE AWARENESS)
-- Additive, idempotent, non-destructive SQL schema migration for Supabase.
-- Does NOT modify or drop any existing tables, columns, or policies.
--
-- Security Model (Clerk Auth + Supabase Service Role):
--   1. Usick One authenticates users via Clerk (`user_2...` string IDs) on the
--      Next.js server (`await auth()`).
--   2. The browser Supabase client (`lib/supabase.ts`) uses the public `anon`
--      key without a Clerk-minted Supabase JWT (`auth.uid()` is NULL, and
--      `auth.uid()` in Postgres casts to UUID which is incompatible with
--      Clerk `user_...` IDs).
--   3. Therefore, direct table access from `anon` and `authenticated` roles is
--      REVOKED, RLS is ENABLED, and only the server-side `service_role` client
--      (after verifying Clerk `auth()` and ownership in `/api/music/connect`)
--      is permitted to read/write rows.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table: public.music_device_sessions
-- Stores per-browser/per-device Usick One Music instances and their playback state.
-- `session_instance_id` identifies the Usick One browser/device instance,
-- while `spotify_device_id` is reserved strictly for official Spotify Connect IDs.
CREATE TABLE IF NOT EXISTS public.music_device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_instance_id TEXT NOT NULL,
  spotify_device_id TEXT DEFAULT NULL,
  device_name TEXT NOT NULL DEFAULT 'Browser Web',
  device_type TEXT NOT NULL DEFAULT 'desktop',
  platform TEXT DEFAULT NULL,
  browser TEXT DEFAULT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  is_active_playback BOOLEAN NOT NULL DEFAULT false,
  can_control BOOLEAN NOT NULL DEFAULT true,
  can_transfer_playback BOOLEAN NOT NULL DEFAULT true,
  current_track_id TEXT DEFAULT NULL,
  current_track_name TEXT DEFAULT NULL,
  current_artist_name TEXT DEFAULT NULL,
  current_album_art TEXT DEFAULT NULL,
  current_track_payload JSONB DEFAULT NULL,
  queue_payload JSONB DEFAULT '[]'::jsonb,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  progress_ms BIGINT NOT NULL DEFAULT 0,
  duration_ms BIGINT NOT NULL DEFAULT 0,
  volume_percent INTEGER NOT NULL DEFAULT 80,
  shuffle_state BOOLEAN NOT NULL DEFAULT false,
  repeat_state TEXT NOT NULL DEFAULT 'off',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_music_device_sessions_user_instance UNIQUE (user_id, session_instance_id)
);

-- Safe idempotent column normalization if an earlier draft created `can_transferplayback`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'music_device_sessions'
      AND column_name = 'can_transferplayback'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'music_device_sessions'
      AND column_name = 'can_transfer_playback'
  ) THEN
    ALTER TABLE public.music_device_sessions
      RENAME COLUMN can_transferplayback TO can_transfer_playback;
  END IF;
END $$;

ALTER TABLE public.music_device_sessions
  ADD COLUMN IF NOT EXISTS can_transfer_playback BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.music_device_sessions
  ADD COLUMN IF NOT EXISTS queue_payload JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_music_device_sessions_user_id
  ON public.music_device_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_music_device_sessions_last_seen
  ON public.music_device_sessions (user_id, last_seen_at DESC);

-- 2. Table: public.music_connect_commands
-- Stores remote playback commands dispatched from a controller device to a target device,
-- along with real acknowledgment status (pending -> processing -> succeeded / failed / expired).
CREATE TABLE IF NOT EXISTS public.music_connect_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  source_instance_id TEXT NOT NULL,
  source_device_name TEXT DEFAULT 'Perangkat Lain',
  target_instance_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  result_message TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 seconds'),
  acknowledged_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.music_connect_commands
  ADD COLUMN IF NOT EXISTS source_device_name TEXT DEFAULT 'Perangkat Lain';

CREATE INDEX IF NOT EXISTS idx_music_connect_commands_target
  ON public.music_connect_commands (user_id, target_instance_id, status, created_at DESC);

-- 3. Enable Row Level Security (RLS) & Revoke Direct Client Table Access
ALTER TABLE public.music_device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_connect_commands ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.music_device_sessions FROM anon, authenticated;
REVOKE ALL ON public.music_connect_commands FROM anon, authenticated;
GRANT ALL ON public.music_device_sessions TO service_role;
GRANT ALL ON public.music_connect_commands TO service_role;

-- 4. Drop legacy `auth.uid()` policies if present and install `service_role` policies
DO $$
BEGIN
  DROP POLICY IF EXISTS music_device_sessions_select_own ON public.music_device_sessions;
  DROP POLICY IF EXISTS music_device_sessions_insert_own ON public.music_device_sessions;
  DROP POLICY IF EXISTS music_device_sessions_update_own ON public.music_device_sessions;
  DROP POLICY IF EXISTS music_device_sessions_delete_own ON public.music_device_sessions;
  DROP POLICY IF EXISTS music_device_sessions_service_role_all ON public.music_device_sessions;

  CREATE POLICY music_device_sessions_service_role_all
    ON public.music_device_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  DROP POLICY IF EXISTS music_connect_commands_select_own ON public.music_connect_commands;
  DROP POLICY IF EXISTS music_connect_commands_insert_own ON public.music_connect_commands;
  DROP POLICY IF EXISTS music_connect_commands_update_own ON public.music_connect_commands;
  DROP POLICY IF EXISTS music_connect_commands_delete_own ON public.music_connect_commands;
  DROP POLICY IF EXISTS music_connect_commands_service_role_all ON public.music_connect_commands;

  CREATE POLICY music_connect_commands_service_role_all
    ON public.music_connect_commands
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Run manually in Supabase SQL Editor ONLY if rolling back
-- Music Connect tables; does NOT affect any existing Usick One tables):
--
-- DROP TABLE IF EXISTS public.music_connect_commands;
-- DROP TABLE IF EXISTS public.music_device_sessions;
-- ============================================================================
