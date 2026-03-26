import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createClient();

  const { data: expos } = await supabase
    .from('expos')
    .select('id, name, venue, start_date, end_date, is_active')
    .order('start_date', { ascending: false });

  if (!expos || expos.length === 0) {
    return NextResponse.json({ expos: [], totals: { total_expos: 0, total_photos: 0, total_visitors: 0 } });
  }

  const { data: transformations } = await supabase
    .from('user_transformations')
    .select('expo_id, mobile_number');

  const rows = transformations || [];

  const expoStats = new Map<string, { photos: number; visitors: Set<string> }>();
  rows.forEach(r => {
    if (!r.expo_id) return;
    if (!expoStats.has(r.expo_id)) {
      expoStats.set(r.expo_id, { photos: 0, visitors: new Set() });
    }
    const stats = expoStats.get(r.expo_id)!;
    stats.photos++;
    if (r.mobile_number) stats.visitors.add(r.mobile_number);
  });

  const { data: groups } = await supabase
    .from('groups')
    .select('expo_id')
    .eq('is_active', true);

  const groupCounts = new Map<string, number>();
  (groups || []).forEach(g => {
    groupCounts.set(g.expo_id, (groupCounts.get(g.expo_id) || 0) + 1);
  });

  const expoOverviews = expos.map(e => {
    const stats = expoStats.get(e.id);
    return {
      ...e,
      total_photos: stats?.photos || 0,
      unique_visitors: stats?.visitors.size || 0,
      group_count: groupCounts.get(e.id) || 0,
    };
  });

  const allVisitors = new Set(rows.map(r => r.mobile_number).filter(Boolean));

  return NextResponse.json({
    expos: expoOverviews,
    totals: {
      total_expos: expos.length,
      total_photos: rows.length,
      total_visitors: allVisitors.size,
    },
  });
}
