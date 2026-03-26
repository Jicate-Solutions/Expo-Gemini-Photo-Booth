-- Seed admin user (password: Maha@2026)
INSERT INTO public.admin_users (email, password_hash, display_name)
VALUES (
    'admin@jicate.com',
    '$2b$10$dhIfJSj.oJJsjFg9E7qDaOEbVJnN/KRwKAqPRvQTH37/Z6Ni/RaEa',
    'Admin'
) ON CONFLICT (email) DO NOTHING;

-- Legacy expo for existing data
INSERT INTO public.expos (id, name, venue, start_date, end_date, username, password_hash, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Pre-Tracking (Legacy)',
    'Various',
    '2025-01-01',
    '2026-03-26',
    'legacy',
    '$2b$10$XuADtu/ujR6LutjnNaYpIuDpht60EKkHL0qtqg3R8hPAELgHM2Wz2',
    false
) ON CONFLICT DO NOTHING;

-- Migrate existing organizations into groups
INSERT INTO public.groups (expo_id, name)
SELECT DISTINCT
    'a0000000-0000-0000-0000-000000000001',
    TRIM(organization)
FROM public.user_transformations
WHERE organization IS NOT NULL AND TRIM(organization) != ''
ON CONFLICT (expo_id, name) DO NOTHING;

-- Back-fill expo_id
UPDATE public.user_transformations
SET expo_id = 'a0000000-0000-0000-0000-000000000001'
WHERE expo_id IS NULL;

-- Back-fill group_id
UPDATE public.user_transformations ut
SET group_id = g.id
FROM public.groups g
WHERE g.expo_id = 'a0000000-0000-0000-0000-000000000001'
  AND TRIM(ut.organization) = g.name
  AND ut.group_id IS NULL;
