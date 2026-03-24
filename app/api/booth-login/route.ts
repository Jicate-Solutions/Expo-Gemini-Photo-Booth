import { NextRequest, NextResponse } from 'next/server';

const BOOTH_ACCOUNTS: Record<string, string> = {
  'admin@jicate.com':    'Jicate@Admin1',
  'maha@jicate.com':     'Jicate@Maha2',
  'manager@jicate.com':  'Jicate@Mgr3',
  'director@jicate.com': 'Jicate@Dir4',
  'booth@jicate.com':    'Jicate@Booth5',
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const valid = BOOTH_ACCOUNTS[email?.toLowerCase().trim()] === password;
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
