import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReelsExpo } from '@/lib/reelsServer';
import {
  AGE_GROUP_IDS, AREA_IDS, GENDER_IDS, PARTICIPANT_TYPE_IDS,
  normalizeInstagram, normalizeMobile, sanitizeSurvey,
} from '@/lib/reels';

/** Public: register for the reels contest → personal code (same mobile again = same code). */
export async function POST(req: NextRequest, { params }: { params: { expoId: string } }) {
  const expo = await getReelsExpo(params.expoId);
  if (!expo) return NextResponse.json({ error: 'This contest link is not active.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const fullName = String(body.fullName ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const mobile = normalizeMobile(body.mobile);
  const ageGroup = String(body.ageGroup ?? '');
  const gender = body.gender ? String(body.gender) : null;
  const area = String(body.area ?? '');
  const participantType = String(body.participantType ?? '');
  const instagramRaw = String(body.instagram ?? '').trim();
  const instagram = instagramRaw ? normalizeInstagram(instagramRaw) : null;

  const fields: Record<string, true> = {};
  if (fullName.length < 2) fields.fullName = true;
  if (!mobile) fields.mobile = true;
  if (!AGE_GROUP_IDS.has(ageGroup)) fields.ageGroup = true;
  if (gender && !GENDER_IDS.has(gender)) fields.gender = true;
  if (!AREA_IDS.has(area)) fields.area = true;
  if (!PARTICIPANT_TYPE_IDS.has(participantType)) fields.participantType = true;
  if (instagramRaw && !instagram) fields.instagram = true;
  if (Object.keys(fields).length) {
    return NextResponse.json({ error: 'Please check the highlighted fields.', fields }, { status: 400 });
  }

  const { data, error } = await createClient().rpc('register_reel_participant', {
    p_expo_id: expo.id,
    p_code_prefix: expo.codePrefix,
    p_full_name: fullName,
    p_mobile: mobile,
    p_age_group: ageGroup,
    p_gender: gender,
    p_area: area,
    p_participant_type: participantType,
    p_instagram_handle: instagram,
    p_guardian_consent: null,
    p_survey: sanitizeSurvey(body.survey, participantType),
  });

  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) {
    console.error('Reels register failed:', error);
    return NextResponse.json({ error: 'Could not register right now. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    code: row.code,
    alreadyRegistered: row.already_registered,
    firstName: fullName.split(' ')[0],
  });
}
