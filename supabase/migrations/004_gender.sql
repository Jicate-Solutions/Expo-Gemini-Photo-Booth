-- Marathon runners: store the runner's gender ('male' | 'female'), chosen on the details form.
-- It picks the poster outfit (male: shorts, female: track pants) and shows in the admin dashboard.
-- Safe to run more than once; only adds a nullable column (existing rows stay NULL).
ALTER TABLE public.user_transformations
    ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IS NULL OR gender IN ('male', 'female'));
