import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReelsExpo } from '@/lib/reelsServer';
import { isInstagramReelUrl, normalizeMobile } from '@/lib/reels';

const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const METRICS = ['followers', 'reach', 'views', 'likes', 'comments', 'shares', 'saves'] as const;

/**
 * Public: submit a reel (multipart form). The participant proves who they are with
 * mobile + their contest code. The Insights screenshot goes to the private 'reel-insights' bucket.
 */
export async function POST(req: NextRequest, { params }: { params: { expoId: string } }) {
  const expo = await getReelsExpo(params.expoId);
  if (!expo) return NextResponse.json({ error: 'This contest link is not active.' }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const mobile = normalizeMobile(form.get('mobile'));
  const code = '#' + String(form.get('code') ?? '').trim().replace(/^#/, '').toUpperCase();
  const reelUrl = String(form.get('reelUrl') ?? '').trim();
  const screenshot = form.get('screenshot');

  if (!mobile) return NextResponse.json({ error: 'Enter a valid 10-digit mobile number.' }, { status: 400 });
  if (!isInstagramReelUrl(reelUrl)) {
    return NextResponse.json({ error: 'Paste the Instagram reel link (instagram.com/reel/...).' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: participant } = await supabase
    .from('reel_participants')
    .select('id')
    .eq('expo_id', expo.id)
    .eq('mobile', mobile)
    .eq('code', code)
    .maybeSingle();
  if (!participant) {
    return NextResponse.json(
      { error: 'Mobile number and contest code do not match. Please check and try again.' },
      { status: 403 },
    );
  }

  // Optional numbers the participant reads from Instagram Insights (the team checks them)
  const metrics: Record<string, number> = {};
  for (const m of METRICS) {
    const raw = String(form.get(m) ?? '').replace(/[,\s]/g, '');
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 2_000_000_000) {
      return NextResponse.json({ error: `Check the number for ${m}.` }, { status: 400 });
    }
    metrics[m] = n;
  }

  // Insights screenshot (required by the contest rules)
  if (!(screenshot instanceof File) || screenshot.size === 0) {
    return NextResponse.json({ error: 'Add a screenshot of your reel Insights.' }, { status: 400 });
  }
  const ext = IMAGE_TYPES[screenshot.type];
  if (!ext) return NextResponse.json({ error: 'Screenshot must be a JPG, PNG or WebP image.' }, { status: 400 });
  if (screenshot.size > MAX_SCREENSHOT_BYTES) {
    return NextResponse.json({ error: 'Screenshot is too large (max 8 MB).' }, { status: 400 });
  }

  const path = `${expo.id}/${participant.id}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('reel-insights')
    .upload(path, Buffer.from(await screenshot.arrayBuffer()), { contentType: screenshot.type });
  if (upErr) {
    console.error('Insights upload failed:', upErr);
    return NextResponse.json({ error: 'Could not upload the screenshot. Please try again.' }, { status: 500 });
  }

  const { error } = await supabase.from('reel_submissions').insert({
    expo_id: expo.id,
    participant_id: participant.id,
    reel_url: reelUrl,
    insights_path: path,
    ...metrics,
  });
  if (error) {
    console.error('Reel submission failed:', error);
    return NextResponse.json({ error: 'Could not save your entry. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
