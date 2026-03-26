-- 1. Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Expos table (each expo gets its own login credentials)
CREATE TABLE IF NOT EXISTS public.expos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    venue TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expo_id UUID NOT NULL REFERENCES public.expos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (expo_id, name)
);

-- 4. Add expo/group FKs to existing user_transformations
ALTER TABLE public.user_transformations
    ADD COLUMN IF NOT EXISTS expo_id UUID REFERENCES public.expos(id),
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_transformations_expo ON public.user_transformations(expo_id);
CREATE INDEX IF NOT EXISTS idx_transformations_group ON public.user_transformations(group_id);
CREATE INDEX IF NOT EXISTS idx_transformations_expo_created ON public.user_transformations(expo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transformations_expo_group ON public.user_transformations(expo_id, group_id);
CREATE INDEX IF NOT EXISTS idx_transformations_expo_theme ON public.user_transformations(expo_id, theme_type, selected_theme);
CREATE INDEX IF NOT EXISTS idx_groups_expo ON public.groups(expo_id);
CREATE INDEX IF NOT EXISTS idx_expos_dates ON public.expos(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_expos_username ON public.expos(username);

-- 6. RLS policies
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_transformations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon read" ON public.admin_users FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon write" ON public.admin_users FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon read" ON public.expos FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon write" ON public.expos FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon read" ON public.groups FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon write" ON public.groups FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon read" ON public.user_transformations FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon write" ON public.user_transformations FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Service role full access" ON public.admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.expos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.groups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.user_transformations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_expos_updated_at
    BEFORE UPDATE ON public.expos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
