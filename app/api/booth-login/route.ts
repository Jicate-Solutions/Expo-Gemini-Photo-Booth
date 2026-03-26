import { NextRequest, NextResponse } from 'next/server';
import { authenticateExpo, generateSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const expo = await authenticateExpo(username, password);

    if (!expo) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sessionToken = generateSessionToken();

    return NextResponse.json({
      success: true,
      session: {
        type: 'expo' as const,
        expoId: expo.id,
        expoName: expo.name,
        username: expo.username,
        sessionToken,
      },
    });
  } catch (e) {
    console.error('Booth login error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
