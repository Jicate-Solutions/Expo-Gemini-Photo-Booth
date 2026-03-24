import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== 'Maha@2026') {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('user_transformations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.log('Supabase error:', error.message, error.code);
    // Table might be empty or not exist yet — return empty array
    return NextResponse.json({ data: [], tableError: error.message });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const { password, mobile } = await req.json();

  if (password !== 'Maha@2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('user_transformations')
    .delete()
    .eq('mobile_number', mobile);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
