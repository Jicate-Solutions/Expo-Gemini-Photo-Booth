import { NextRequest, NextResponse } from 'next/server';
import { getReelsExpo } from '@/lib/reelsServer';

/** Public: what the QR page needs to show (expo name, caption handles). */
export async function GET(_req: NextRequest, { params }: { params: { expoId: string } }) {
  const expo = await getReelsExpo(params.expoId);
  if (!expo) return NextResponse.json({ error: 'This contest link is not active.' }, { status: 404 });
  return NextResponse.json({ name: expo.name, handles: expo.handles });
}
