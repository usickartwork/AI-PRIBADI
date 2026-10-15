-- ==============================================================================
-- USICK ONE: NOTEBOOK FEATURE (PERSONAL NOTES & CROSS-DEVICE SYNC)
-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Aman dijalankan berulang kali (Idempotent).
-- Tidak mengubah tabel lama (chat_history, schedules, msg_*, dll.).
-- ==============================================================================

-- 1. Ekstensi pgcrypto untuk pembuatan UUID v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Buat tabel user_notes
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Indeks untuk query daftar catatan dan pengurutan cepat
CREATE INDEX IF NOT EXISTS idx_user_notes_user_updated 
    ON public.user_notes (user_id, updated_at DESC) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_notes_user_pinned 
    ON public.user_notes (user_id, is_pinned DESC, updated_at DESC) 
    WHERE deleted_at IS NULL;

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan RLS (Service role memiliki akses penuh untuk API backend)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_notes' 
        AND policyname = 'Service role has full access to user_notes'
    ) THEN
        CREATE POLICY "Service role has full access to user_notes"
            ON public.user_notes
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

