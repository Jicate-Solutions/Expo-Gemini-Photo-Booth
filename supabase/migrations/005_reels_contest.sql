-- Reels Contest ("Impact Reel Challenge") — stored per expo, shown in the admin dashboard.
-- Visitors register via a QR code, get a code like #ERDMRTHN001, post a reel, then submit it.
-- Safe to run more than once.

-- 1. Participants (one registration per mobile number per expo)
CREATE TABLE IF NOT EXISTS public.reel_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expo_id UUID NOT NULL REFERENCES public.expos(id) ON DELETE CASCADE,
    -- Sequential per expo: 1, 2, 3 ... → code '#ERDMRTHN001'
    code_number INT NOT NULL,
    code TEXT NOT NULL,
    -- Section A: basic details
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    age_group TEXT NOT NULL CHECK (age_group IN ('under_18', '18_25', '26_40', '41_60', '60_plus')),
    gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other')),
    area TEXT NOT NULL CHECK (area IN ('erode_town', 'nearby_town', 'outside_district')),
    participant_type TEXT NOT NULL CHECK (participant_type IN ('student', 'working_professional', 'parent', 'teacher', 'others')),
    instagram_handle TEXT,
    -- Contest rule: ages 13–17 need a parent's/guardian's consent recorded at registration
    guardian_consent BOOLEAN,
    -- Sections B–D: optional awareness survey (reported only as totals, never per person)
    survey JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- When they accepted the privacy notice (DPDP Act 2023)
    privacy_accepted_at TIMESTAMPTZ,
    UNIQUE (expo_id, mobile),
    UNIQUE (expo_id, code_number)
);

-- 2. Reel submissions (a participant may submit more than one; only their best is scored)
CREATE TABLE IF NOT EXISTS public.reel_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expo_id UUID NOT NULL REFERENCES public.expos(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.reel_participants(id) ON DELETE CASCADE,
    reel_url TEXT NOT NULL,
    -- Path in the private 'reel-insights' storage bucket
    insights_path TEXT,
    -- Insights numbers (typed by participant, checked/corrected by the tracking team)
    followers INT CHECK (followers IS NULL OR followers >= 0),
    reach INT CHECK (reach IS NULL OR reach >= 0),
    views INT CHECK (views IS NULL OR views >= 0),
    likes INT CHECK (likes IS NULL OR likes >= 0),
    comments INT CHECK (comments IS NULL OR comments >= 0),
    shares INT CHECK (shares IS NULL OR shares >= 0),
    saves INT CHECK (saves IS NULL OR saves >= 0),
    -- Jury / checklist marks (reach 30 + engagement 25 are calculated by the app)
    message_score NUMERIC(4,1) CHECK (message_score IS NULL OR message_score BETWEEN 0 AND 25),
    creativity_score NUMERIC(4,1) CHECK (creativity_score IS NULL OR creativity_score BETWEEN 0 AND 15),
    compliance_score NUMERIC(4,1) CHECK (compliance_score IS NULL OR compliance_score BETWEEN 0 AND 5),
    -- Prize categories: e.g. 'best_family', 'best_student', 'most_impactful'
    prize_category TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'valid', 'disqualified')),
    admin_notes TEXT
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_reel_participants_expo_created ON public.reel_participants(expo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reel_submissions_expo_created ON public.reel_submissions(expo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reel_submissions_participant ON public.reel_submissions(participant_id);

-- 4. RLS: no public access; only the server (service role) reads/writes
ALTER TABLE public.reel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.reel_participants;
CREATE POLICY "Service role full access" ON public.reel_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON public.reel_submissions;
CREATE POLICY "Service role full access" ON public.reel_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS tr_reel_submissions_updated_at ON public.reel_submissions;
CREATE TRIGGER tr_reel_submissions_updated_at
    BEFORE UPDATE ON public.reel_submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. Register (or find) a participant and hand out the next code — safe when many register at once.
--    Same mobile again → returns the existing registration (no duplicate code).
CREATE OR REPLACE FUNCTION public.register_reel_participant(
    p_expo_id UUID,
    p_code_prefix TEXT,
    p_full_name TEXT,
    p_mobile TEXT,
    p_age_group TEXT,
    p_gender TEXT,
    p_area TEXT,
    p_participant_type TEXT,
    p_instagram_handle TEXT,
    p_guardian_consent BOOLEAN,
    p_survey JSONB
)
RETURNS TABLE (id UUID, code TEXT, already_registered BOOLEAN)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_next INT;
    v_row public.reel_participants%ROWTYPE;
BEGIN
    -- One registration at a time per expo, so code numbers never clash
    PERFORM pg_advisory_xact_lock(hashtext('reels:' || p_expo_id::text));

    SELECT * INTO v_row FROM public.reel_participants rp
     WHERE rp.expo_id = p_expo_id AND rp.mobile = p_mobile;
    IF FOUND THEN
        RETURN QUERY SELECT v_row.id, v_row.code, true;
        RETURN;
    END IF;

    SELECT COALESCE(MAX(rp.code_number), 0) + 1 INTO v_next
      FROM public.reel_participants rp WHERE rp.expo_id = p_expo_id;

    INSERT INTO public.reel_participants (
        expo_id, code_number, code, full_name, mobile, age_group, gender, area,
        participant_type, instagram_handle, guardian_consent, survey, privacy_accepted_at
    ) VALUES (
        p_expo_id, v_next, '#' || p_code_prefix || lpad(v_next::text, 3, '0'),
        p_full_name, p_mobile, p_age_group, p_gender, p_area,
        p_participant_type, p_instagram_handle, p_guardian_consent, COALESCE(p_survey, '{}'::jsonb), now()
    )
    RETURNING * INTO v_row;

    RETURN QUERY SELECT v_row.id, v_row.code, false;
END;
$$;

-- Only the server may call it
REVOKE ALL ON FUNCTION public.register_reel_participant(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_reel_participant(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) TO service_role;

-- 6. Private bucket for Instagram Insights screenshots (personal data — admins view via signed links)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reel-insights', 'reel-insights', false)
ON CONFLICT (id) DO NOTHING;
