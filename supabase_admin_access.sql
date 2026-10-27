-- ==============================================================================
-- USICK ONE — ADMIN ACCESS & AUTHORIZATION SCHEMA
-- Script ini dirancang untuk dijalankan secara manual pada Supabase SQL Editor.
-- Jangan pernah mengeksekusi script ini otomatis tanpa peninjauan izin admin.
-- ==============================================================================

-- ─── BAGIAN 1: PEMBUATAN TABEL DAN KEBIJAKAN RLS ─────────────────────────────
-- Bagian ini membuat struktur tabel admin_access dan mengamankannya dengan RLS.
-- Pengguna anonim maupun pengguna terautentikasi biasa TIDAK memiliki izin baca/tulis.
-- Hanya backend server (service_role) yang memiliki hak akses penuh.

CREATE TABLE IF NOT EXISTS public.admin_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by TEXT
);

-- Indeks performa pencarian email yang dinormalisasi (lowercase)
CREATE INDEX IF NOT EXISTS idx_admin_access_email ON public.admin_access (email);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.admin_access ENABLE ROW LEVEL SECURITY;

-- Pastikan policy lama dibersihkan terlebih dahulu
DROP POLICY IF EXISTS "Service role only access on admin_access" ON public.admin_access;
DROP POLICY IF EXISTS "Service role only access" ON public.admin_access;
DROP POLICY IF EXISTS "Deny all public access to admin_access" ON public.admin_access;

-- Kebijakan RLS: Service role memiliki akses penuh untuk otorisasi server-side
CREATE POLICY "Service role only access on admin_access" ON public.admin_access
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── DEFENSE-IN-DEPTH: HAK AKSES LEVEL TABEL (GRANTS & REVOKES) ──────────────
-- Pastikan role publik (anon dan authenticated) dicabut hak aksesnya secara eksplisit
-- pada level tabel di PostgreSQL. Ini memastikan data tidak dapat diakses bahkan jika
-- RLS tidak sengaja dimodifikasi.
REVOKE ALL ON TABLE public.admin_access FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_access TO service_role;


-- ─── BAGIAN 2: PENDAFTARAN EMAIL ADMIN AWAL ──────────────────────────────────
-- Jalankan bagian ini hanya ketika ingin mendaftarkan admin awal.
-- PERHATIAN KEAMANAN: Menggunakan `ON CONFLICT (email) DO NOTHING;`
-- Ini memastikan bahwa jika akun admin sudah terdaftar namun sedang dinonaktifkan
-- (is_active = false), eksekusi script ini TIDAK AKAN otomatis mengaktifkannya kembali!

INSERT INTO public.admin_access (email, is_active, created_by)
VALUES ('filiuspllahendra@gmail.com', true, 'manual_superadmin_init')
ON CONFLICT (email) DO NOTHING;
