import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const {
      name, mobile, group, theme, themeType, careerStyle,
      photoUrl, originalPhoto,
      expoId, groupId, bibNumber, gender,
    } = await req.json();

    const row: Record<string, unknown> = {
      name,
      organization: group || '',
      email: '',
      mobile_number: mobile,
      selected_theme: theme,
      theme_type: themeType,
      career_style: themeType === 'career' ? careerStyle : null,
      transformed_photo_url: photoUrl || '',
      original_photo_url: (originalPhoto || '').substring(0, 100),
      expo_id: expoId || null,
      group_id: groupId || null,
    };
    // Marathon runners only — other expos never send a bib
    if (bibNumber) row.bib_number = String(bibNumber).trim();
    if (gender === 'male' || gender === 'female') row.gender = gender;

    const insert = (body: Record<string, unknown>) =>
      fetch(`${SUPABASE_URL}/rest/v1/user_transformations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(body),
      });

    let res = await insert(row);

    // If an optional marathon column's migration hasn't been run yet, still save the visitor without it
    // (003 adds bib_number, 004 adds gender)
    const optionalCols: Record<string, string> = { bib_number: '003_bib_number.sql', gender: '004_gender.sql' };
    if (!res.ok) {
      const errText = await res.clone().text();
      const missing = Object.keys(optionalCols).filter(c => c in row && errText.includes(c));
      if (missing.length) {
        missing.forEach(c => console.warn(`${c} column missing — run supabase/migrations/${optionalCols[c]}. Saving without it.`));
        const reduced = Object.fromEntries(Object.entries(row).filter(([k]) => !missing.includes(k)));
        res = await insert(reduced);
      }
    }

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
