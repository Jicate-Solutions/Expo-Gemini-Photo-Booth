import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();
    if (!base64 || !mimeType) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const ext = mimeType.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const imageBuffer = Buffer.from(base64, 'base64');

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/transformations/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': mimeType,
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json({ error: `Upload failed: ${uploadRes.status} ${err}` }, { status: 500 });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/transformations/${fileName}`;
    return NextResponse.json({ publicUrl });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
