import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_transformations')
    .update({ expo_id: '89b3e0d1-4c34-4e1e-a515-8a6899f40971' })
    .is('expo_id', null)
    .gte('created_at', '2026-04-10')
    .lte('created_at', '2026-04-13T23:59:59')
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ fixed: data?.length || 0 });
}
