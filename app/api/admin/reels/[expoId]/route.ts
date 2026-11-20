import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDefaultReelsExpoId, isAdminRequest, UUID_RE } from '@/lib/reelsServer';
import { SURVEY } from '@/lib/reels';
import { PRIZE_CATEGORIES, SUBMISSION_STATUSES } from '@/lib/reelsScore';

export const dynamic = 'force-dynamic';

type Params = { params: { expoId: string } };

/** Read every row (Supabase returns at most 1000 per request). */
async function fetchAll<T>(table: string, columns: string, expoId: string): Promise<T[]> {
  const supabase = createClient();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq('expo_id', expoId)
      .order('created_at', { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return rows;
  }
}

interface ParticipantRow {
  id: string;
  created_at: string;
  code: string;
  code_number: number;
  full_name: string;
  mobile: string;
  age_group: string;
  gender: string | null;
  area: string;
  participant_type: string;
  instagram_handle: string | null;
  guardian_consent: boolean | null;
  survey: Record<string, string | string[]> | null;
}

/**
 * Admin: everything for the Reels Contest tab.
 * Survey answers are returned ONLY as totals (never per person), as the plan's safeguards require.
 */
export async function GET(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!UUID_RE.test(params.expoId)) return NextResponse.json({ error: 'Expo not found' }, { status: 404 });

  const supabase = createClient();
  const { data: expo } = await supabase
    .from('expos')
    .select('id, name, metadata')
    .eq('id', params.expoId)
    .maybeSingle();
  if (!expo) return NextResponse.json({ error: 'Expo not found' }, { status: 404 });

  const meta = (expo.metadata ?? {}) as Record<string, unknown>;
  const enabled = meta.mode === 'marathon' || meta.reels_enabled === true;
  const isPrintedQrExpo = (await getDefaultReelsExpoId()) === expo.id;

  try {
    const [participants, submissions] = await Promise.all([
      fetchAll<ParticipantRow>(
        'reel_participants',
        'id, created_at, code, code_number, full_name, mobile, age_group, gender, area, participant_type, instagram_handle, guardian_consent, survey',
        expo.id,
      ),
      fetchAll<Record<string, unknown> & { insights_path: string | null; participant_id: string }>(
        'reel_submissions',
        'id, created_at, updated_at, participant_id, reel_url, insights_path, followers, reach, views, likes, comments, shares, saves, message_score, creativity_score, compliance_score, prize_category, status, admin_notes',
        expo.id,
      ),
    ]);

    // Survey totals: question → answer → count (free-text questions: number of answers only)
    const survey = SURVEY.map(q => {
      const eligible = participants.filter(p => !q.showFor || p.participant_type === q.showFor);
      // Multi-select answers are lists; single answers are strings
      const answers = eligible.map(p => p.survey?.[q.id])
        .filter((a): a is string | string[] => (typeof a === 'string' && a !== '') || (Array.isArray(a) && a.length > 0));
      return {
        id: q.id,
        section: q.section,
        showFor: q.showFor ?? null,
        text: q.text.en,
        eligible: eligible.length,
        answered: answers.length,
        options: q.options
          ? q.options.map(o => ({ id: o.id, label: o.label.en, count: answers.filter(a => (Array.isArray(a) ? a.includes(o.id) : a === o.id)).length }))
          : null,
      };
    });

    // Temporary private links to the Insights screenshots (valid 1 hour)
    const paths = submissions.map(s => s.insights_path).filter((p): p is string => !!p);
    const signed = new Map<string, string>();
    if (paths.length) {
      const { data } = await supabase.storage.from('reel-insights').createSignedUrls(paths, 3600);
      data?.forEach(d => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
    }

    const byId = new Map(participants.map(p => [p.id, p]));
    return NextResponse.json({
      expo: { id: expo.id, name: expo.name, enabled, isPrintedQrExpo },
      // Individual survey answers are deliberately NOT sent — only the totals below
      participants: participants.map(p => ({
        id: p.id, created_at: p.created_at, code: p.code, code_number: p.code_number,
        full_name: p.full_name, mobile: p.mobile, age_group: p.age_group, gender: p.gender, area: p.area,
        participant_type: p.participant_type, instagram_handle: p.instagram_handle, guardian_consent: p.guardian_consent,
        submissionCount: submissions.filter(s => s.participant_id === p.id).length,
      })),
      submissions: submissions.map(s => {
        const p = byId.get(s.participant_id);
        return {
          ...s,
          insights_url: s.insights_path ? signed.get(s.insights_path) ?? null : null,
          participant: p
            ? { code: p.code, full_name: p.full_name, mobile: p.mobile, instagram_handle: p.instagram_handle, participant_type: p.participant_type }
            : null,
        };
      }),
      survey,
    });
  } catch (e) {
    console.error('Admin reels load failed:', e);
    return NextResponse.json({ error: 'Could not load reels data' }, { status: 500 });
  }
}

const INT_FIELDS = ['followers', 'reach', 'views', 'likes', 'comments', 'shares', 'saves'] as const;
const SCORE_LIMITS = { message_score: 25, creativity_score: 15, compliance_score: 5 } as const;

/** Admin: save jury marks / corrected Insights numbers / status for one submission. */
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? '');
  const fields = (body?.fields ?? {}) as Record<string, unknown>;
  if (!UUID_RE.test(id) || !UUID_RE.test(params.expoId)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  const bad = (f: string) => NextResponse.json({ error: `Invalid value for ${f}` }, { status: 400 });
  const isBlank = (v: unknown) => v === null || v === '' || v === undefined;

  for (const f of INT_FIELDS) {
    if (!(f in fields)) continue;
    const v = fields[f];
    if (isBlank(v)) { update[f] = null; continue; }
    const num = Number(v);
    if (!Number.isInteger(num) || num < 0 || num > 2_000_000_000) return bad(f);
    update[f] = num;
  }
  for (const [f, max] of Object.entries(SCORE_LIMITS)) {
    if (!(f in fields)) continue;
    const v = fields[f];
    if (isBlank(v)) { update[f] = null; continue; }
    const num = Number(v);
    if (!Number.isFinite(num) || num < 0 || num > max) return bad(f);
    update[f] = Math.round(num * 10) / 10;
  }
  if ('status' in fields) {
    if (!SUBMISSION_STATUSES.includes(fields.status as (typeof SUBMISSION_STATUSES)[number])) return bad('status');
    update.status = fields.status;
  }
  if ('prize_category' in fields) {
    const v = fields.prize_category;
    if (isBlank(v)) update.prize_category = null;
    else if (PRIZE_CATEGORIES.some(p => p.id === v)) update.prize_category = v;
    else return bad('prize_category');
  }
  if ('admin_notes' in fields) {
    update.admin_notes = isBlank(fields.admin_notes) ? null : String(fields.admin_notes).slice(0, 500);
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const { data, error } = await createClient()
    .from('reel_submissions')
    .update(update)
    .eq('id', id)
    .eq('expo_id', params.expoId)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('Admin reels update failed:', error);
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
