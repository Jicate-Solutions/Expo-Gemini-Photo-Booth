import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReelsExpo } from '@/lib/reelsServer';
import { normalizeMobile } from '@/lib/reels';

/**
 * Public: "Already registered?" — find a participant's code by mobile number.
 * Returns only the code and first name (nothing else about the person).
 */
export async function POST(req: NextRequest, { params }: { params: { expoId: string } }) {
  const expo = await getReelsExpo(params.expoId);
  if (!expo) return NextResponse.json({ error: 'This contest link is not active.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const mobile = normalizeMobile(body?.mobile);
  if (!mobile) return NextResponse.json({ error: 'Enter a valid 10-digit mobile number.' }, { status: 400 });

  const { data } = await createClient()
    .from('reel_participants')
    .select('code, full_name')
    .eq('expo_id', expo.id)
    .eq('mobile', mobile)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ code: data.code, firstName: String(data.full_name).split(' ')[0] });
}
