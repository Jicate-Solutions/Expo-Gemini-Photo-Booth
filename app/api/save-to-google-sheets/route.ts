import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, organization, email, mobile, theme, themeType, careerStyle, imageUrl, timestamp } = body;

    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

    if (!webhookUrl) {
      console.log('Google Sheet webhook not configured, skipping.');
      return NextResponse.json({ success: true, skipped: true });
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: timestamp || new Date().toISOString(),
        name,
        organization,
        email,
        mobile,
        theme,
        themeType,
        careerStyle: careerStyle || '',
        imageUrl: imageUrl || '',
      }),
    });

    if (!res.ok) {
      throw new Error(`Webhook responded with ${res.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Sheets error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save to sheets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
