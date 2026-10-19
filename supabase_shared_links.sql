-- ==============================================================================
-- USICK ONE: SHARED LINKS FEATURE (SHARE PROJECT & SHARED LINKS MANAGEMENT)
-- Jalankan di Supabase Dashboard > SQL Editor.
-- Aman dijalankan berulang kali (Idempotent).
-- Tidak mengubah atau menghapus data di tabel lain.
-- ==============================================================================

-- 1. Pastikan ekstensi pgcrypto tersedia untuk pembuatan UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Buat tabel shared_links
CREATE TABLE IF NOT EXISTS public.shared_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'chat',
    content_id TEXT NOT NULL,
    public_token TEXT NOT NULL UNIQUE,
    title_snapshot TEXT NOT NULL DEFAULT 'Untitled Project',
    messages_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Indeks untuk pencarian token publik cepat (hanya link aktif)
CREATE INDEX IF NOT EXISTS idx_shared_links_public_token 
    ON public.shared_links (public_token) 
    WHERE revoked_at IS NULL;

-- 4. Indeks untuk manajemen tautan milik user (hanya link aktif)
CREATE INDEX IF NOT EXISTS idx_shared_links_owner_created 
    ON public.shared_links (owner_id, created_at DESC) 
    WHERE revoked_at IS NULL;

-- 5. Indeks untuk pengecekan link per proyek & pemilik
CREATE INDEX IF NOT EXISTS idx_shared_links_owner_content 
    ON public.shared_links (owner_id, content_id) 
    WHERE revoked_at IS NULL;

-- 6. Aktifkan Row Level Security (RLS)
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- 7. Kebijakan RLS: Service Role (Backend API) memiliki akses penuh
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shared_links' 
        AND policyname = 'Service role has full access to shared_links'
    ) THEN
        CREATE POLICY "Service role has full access to shared_links"
            ON public.shared_links
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 8. Kebijakan RLS: Public / Anon dapat membaca tautan yang belum dicabut
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shared_links' 
        AND policyname = 'Public can view active shared links'
    ) THEN
        CREATE POLICY "Public can view active shared links"
            ON public.shared_links
            FOR SELECT
            TO anon, authenticated
            USING (revoked_at IS NULL);
    END IF;
END $$;

