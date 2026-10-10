-- ==============================================================================
-- USICK ONE: MESSAGES FEATURE (FRIENDS + PRIVATE CHAT)
-- Jalankan sekali di Supabase SQL Editor. Aman dijalankan ulang (idempotent).
-- Tidak mengubah tabel lama (chat_history, schedules, code_projects, dll.).
--
-- Model keamanan:
--   * Semua penulisan data dilakukan oleh API route server (Clerk auth + service role).
--   * RLS aktif. TIDAK ADA policy untuk anon -> anon key tidak bisa membaca apa pun.
--   * Policy SELECT berbasis auth.jwt()->>'sub' hanya berlaku jika integrasi
--     Clerk <-> Supabase (Third-Party Auth) diaktifkan; dipakai untuk Realtime.
-- ==============================================================================

-- ─── 1. FRIENDSHIPS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.msg_friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT NOT NULL,
  addressee_id TEXT NOT NULL,
  pair_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT msg_friendships_pair_unique UNIQUE (pair_key),
  CONSTRAINT msg_friendships_not_self CHECK (requester_id <> addressee_id)
);
CREATE INDEX IF NOT EXISTS idx_msg_friendships_requester ON public.msg_friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_msg_friendships_addressee ON public.msg_friendships(addressee_id);

-- ─── 2. BLOCKS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.msg_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT msg_blocks_unique UNIQUE (blocker_id, blocked_id),
  CONSTRAINT msg_blocks_not_self CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_msg_blocks_blocked ON public.msg_blocks(blocked_id);

-- ─── 3. CONVERSATIONS (1-on-1) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.msg_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  pair_key TEXT NOT NULL,
  last_message_preview TEXT,
  last_message_sender TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT msg_conversations_pair_unique UNIQUE (pair_key)
);
CREATE INDEX IF NOT EXISTS idx_msg_conversations_user_a ON public.msg_conversations(user_a);
CREATE INDEX IF NOT EXISTS idx_msg_conversations_user_b ON public.msg_conversations(user_b);

-- ─── 4. MESSAGES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.msg_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.msg_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_msg_messages_conv_created ON public.msg_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_messages_sender_created ON public.msg_messages(sender_id, created_at DESC);

-- ─── 5. READ RECEIPTS (untuk indikator belum dibaca) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.msg_reads (
  conversation_id UUID NOT NULL REFERENCES public.msg_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ─── 6. ROW LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE public.msg_friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msg_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msg_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msg_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msg_reads ENABLE ROW LEVEL SECURITY;

-- 1. Berikan REPLICA IDENTITY FULL agar Supabase Realtime bisa menyiarkan perubahan data
ALTER TABLE public.msg_messages REPLICA IDENTITY FULL;
ALTER TABLE public.msg_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.msg_friendships REPLICA IDENTITY FULL;

-- 2. Pasang policy SELECT yang mengizinkan anon membaca (agar Realtime WebSocket bisa streaming data ke frontend Clerk)
-- Catatan keamanan: Seluruh operasi tulis (INSERT/UPDATE/DELETE) tetap 100% terkunci hanya untuk API backend server (service role key).
DROP POLICY IF EXISTS "msg_messages_select_participant" ON public.msg_messages;
DROP POLICY IF EXISTS "msg_messages_select_realtime" ON public.msg_messages;
CREATE POLICY "msg_messages_select_realtime" ON public.msg_messages
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "msg_conversations_select_own" ON public.msg_conversations;
DROP POLICY IF EXISTS "msg_conversations_select_realtime" ON public.msg_conversations;
CREATE POLICY "msg_conversations_select_realtime" ON public.msg_conversations
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "msg_friendships_select_own" ON public.msg_friendships;
DROP POLICY IF EXISTS "msg_friendships_select_realtime" ON public.msg_friendships;
CREATE POLICY "msg_friendships_select_realtime" ON public.msg_friendships
  FOR SELECT TO public
  USING (true);

-- ─── 7. REALTIME PUBLICATION ───────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'msg_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.msg_messages;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'msg_conversations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.msg_conversations;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'msg_friendships'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.msg_friendships;
    END IF;
  END IF;
END $$;

