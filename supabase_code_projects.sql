-- ==============================================================================
-- USICK ONE: CODE PROJECTS PERSISTENCE TABLE (MULTI-DEVICE SYNC)
-- Tabel ini menyimpan seluruh proyek AI Code Workspace per user_id
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.code_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_code_projects UNIQUE (user_id)
);

-- Index user_id untuk performa query cepat
CREATE INDEX IF NOT EXISTS idx_code_projects_user_id ON public.code_projects(user_id);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.code_projects ENABLE ROW LEVEL SECURITY;

-- Policy Select & Upsert
DROP POLICY IF EXISTS "code_projects_select_policy" ON public.code_projects;
CREATE POLICY "code_projects_select_policy" ON public.code_projects
  FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "code_projects_all_policy" ON public.code_projects;
CREATE POLICY "code_projects_all_policy" ON public.code_projects
  FOR ALL USING (auth.uid()::TEXT = user_id::TEXT OR auth.uid() IS NULL);

