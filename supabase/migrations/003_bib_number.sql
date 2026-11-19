-- Marathon runners: store the runner's race bib number with each photo.
-- Safe to run more than once; only adds a nullable column (existing rows stay NULL).
ALTER TABLE public.user_transformations
    ADD COLUMN IF NOT EXISTS bib_number TEXT;
