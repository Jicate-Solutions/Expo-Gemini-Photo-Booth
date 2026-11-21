import { NextRequest, NextResponse } from 'next/server';
import { getReelsExpo } from '@/lib/reelsServer';
import { computeResults } from '@/lib/reelsResults';
import { normalizeMobile } from '@/lib/reels';

export const dynamic = 'force-dynamic';

type Params = { params: { expoId: string } };

/**
 * Public results (plan §7 screen 10) — only after the admin presses "Publish results".
 * GET: top 10 + prize winners (first name + initial and code only — never mobile numbers).
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const expo = await getReelsExpo(params.expoId);
  if (!expo) return NextResponse.json({ error: 'This contest link is not active.' }, { status: 404 });
  if (!expo.resultsPublished) return NextResponse.json({ error: 'not_published' }, { status: 403 });

  try {
    const { leaderboard, winners } = await computeResults(expo.id);
    return NextResponse.json({ leaderboard, winners });
  } catch (e) {
    console.error('Results load failed:', e);
    return NextResponse.json({ error: 'Could not load results' }, { status: 500 });
  }
}

/**
 * POST { mobile, code }: the participant's own result + certificate details.
 * Needs BOTH mobile and code (like reel submission), since it returns the full name for the certificate.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const expo = await getReelsExpo(params.expoId);
  if (!expo) return NextResponse.json({ error: 'This contest link is not active.' }, { status: 404 });
  if (!expo.resultsPublished) return NextResponse.json({ error: 'not_published' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const mobile = normalizeMobile(body?.mobile);
  const code = String(body?.code ?? '').trim().toUpperCase().replace(/^([^#])/, '#$1');
  if (!mobile || code.length < 4) {
    return NextResponse.json({ error: 'Enter your mobile number and contest code.' }, { status: 400 });
  }

  try {
    const { byParticipant, participants } = await computeResults(expo.id);
    const me = participants.find(p => p.mobile === mobile && p.code.toUpperCase() === code);
    if (!me) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const result = byParticipant.get(me.id);
    return NextResponse.json({
      name: me.full_name,
      code: me.code,
      // Certificates for all valid entries (§5.6)
      eligible: !!result,
      rank: result?.rank ?? null,
      score: result?.score ?? null,
      prize: result?.prize ?? null,
    });
  } catch (e) {
    console.error('Result lookup failed:', e);
    return NextResponse.json({ error: 'Could not load your result' }, { status: 500 });
  }
}
