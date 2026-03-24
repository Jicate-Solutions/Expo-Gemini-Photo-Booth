import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { name, mobile, group, theme, themeType, careerStyle, photoUrl, originalPhoto } = await req.json();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_transformations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        name,
        organization: group || '',
        email: '',
        mobile_number: mobile,
        selected_theme: theme,
        theme_type: themeType,
        career_style: themeType === 'career' ? careerStyle : null,
        transformed_photo_url: photoUrl || '',
        original_photo_url: (originalPhoto || '').substring(0, 100),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('DB save failed:', err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Save user exception:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
