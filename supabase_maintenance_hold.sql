-- ==============================================================================
-- USICK ONE / ONE MIND — USER HOLD & MAINTENANCE MODE SCHEMA MIGRATION
-- File ini disiapkan untuk ditinjau terlebih dahulu sebelum dijalankan manual
-- pada Supabase SQL Editor. JANGAN MENJALANKAN OTOMATIS KE PRODUKSI.
-- ==============================================================================

-- ─── 1. TABEL PENGATURAN MAINTENANCE MODE GLOBAL & PER-FITUR ─────────────────
CREATE TABLE IF NOT EXISTS public.system_maintenance (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  title TEXT,
  message TEXT,
  estimated_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by TEXT -- Email admin yang mengubah status
);

-- Kolom tambahan untuk skema tabel yang sudah ada
ALTER TABLE public.system_maintenance ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.system_maintenance ADD COLUMN IF NOT EXISTS estimated_end TIMESTAMPTZ;

-- RLS & Grants untuk system_maintenance
ALTER TABLE public.system_maintenance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.system_maintenance FROM anon, authenticated;
GRANT ALL ON TABLE public.system_maintenance TO service_role;

-- Inisialisasi baris konfigurasi global & per-fitur (default: Maintenance OFF)
INSERT INTO public.system_maintenance (id, is_enabled, title, message, updated_by)
VALUES
  ('global_config', false, 'One Mind sedang dalam pemeliharaan', 'Kami sedang melakukan pemeliharaan sistem untuk meningkatkan layanan. Silakan coba kembali nanti.', 'initial_setup'),
  ('chat', false, 'Chat AI Sedang Dalam Pemeliharaan', 'Fitur percakapan AI sedang diperbarui. Fitur lainnya tetap dapat digunakan.', 'initial_setup'),
  ('code', false, 'Code Studio Sedang Dalam Pemeliharaan', 'Fitur Code Studio & Generate PRD sedang dalam pemeliharaan berkala.', 'initial_setup'),
  ('schedule', false, 'Schedule Sedang Dalam Pemeliharaan', 'Fitur jadwal dan pengingat sedang dalam pemeliharaan.', 'initial_setup'),
  ('messages', false, 'Messages Sedang Dalam Pemeliharaan', 'Layanan percakapan instan sedang dalam peningkatan server.', 'initial_setup'),
  ('image', false, 'Image Studio Sedang Dalam Pemeliharaan', 'Layanan kreasi dan translasi gambar sedang dalam pemeliharaan.', 'initial_setup'),
  ('music', false, 'Music One Sedang Dalam Pemeliharaan', 'Server streaming audio sedang dalam pemeliharaan sistem.', 'initial_setup'),
  ('notebook', false, 'Notebook Sedang Dalam Pemeliharaan', 'Fitur catatan pribadi sedang dalam sinkronisasi sistem.', 'initial_setup'),
  ('emergency', false, 'Emergency Sedang Dalam Pemeliharaan', 'Pusat kontak darurat sedang diperbarui.', 'initial_setup'),
  ('game', false, 'Game Center Sedang Dalam Pemeliharaan', 'Arena game sedang dalam pemeliharaan berkala.', 'initial_setup'),
  ('faith', false, 'Faith Space Sedang Dalam Pemeliharaan', 'Ruang renungan batin sedang dalam pemeliharaan sistem.', 'initial_setup')
ON CONFLICT (id) DO NOTHING;


-- ─── 2. TABEL STATUS PENGUNCIAN PENGGUNA (USER HOLD) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.user_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- Clerk User ID (user_...)
  user_email TEXT, -- Snapshot email akun untuk kemudahan audit
  is_held BOOLEAN NOT NULL DEFAULT true,
  held_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ, -- NULL berarti penguncian permanen/tanpa batas waktu sampai di-unhold manual
  reason TEXT, -- Catatan internal admin (TIDAK PERNAH ditampilkan kepada pengguna)
  held_by TEXT NOT NULL, -- Email admin yang melakukan hold
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  unheld_at TIMESTAMPTZ,
  unheld_by TEXT
);

-- Indeks pencarian cepat berdasarkan user_id dan status aktif
CREATE INDEX IF NOT EXISTS idx_user_holds_user_id ON public.user_holds (user_id);
CREATE INDEX IF NOT EXISTS idx_user_holds_is_held ON public.user_holds (is_held);

-- RLS & Grants untuk user_holds
ALTER TABLE public.user_holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_holds FROM anon, authenticated;
GRANT ALL ON TABLE public.user_holds TO service_role;


-- ─── 3. TABEL AUDIT LOG TINDAKAN ADMINISTRATIF ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- 'user_hold', 'user_unhold', 'maintenance_enable', 'maintenance_disable'
  target_id TEXT, -- e.g. Clerk user_id atau 'global_config'
  performed_by TEXT NOT NULL, -- Email admin
  details JSONB, -- Rincian durasi, alasan, dll.
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);

-- RLS & Grants untuk admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_audit_logs FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_audit_logs TO service_role;
