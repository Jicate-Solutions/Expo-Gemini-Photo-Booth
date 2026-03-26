import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { expoId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();

  // Fetch expo info
  const { data: expo } = await supabase
    .from('expos')
    .select('id, name, venue, start_date, end_date')
    .eq('id', params.expoId)
    .single();

  if (!expo) {
    return NextResponse.json({ error: 'Expo not found' }, { status: 404 });
  }

  // Fetch all transformations for this expo
  const { data: transformations } = await supabase
    .from('user_transformations')
    .select('id, mobile_number, selected_theme, theme_type, group_id, created_at')
    .eq('expo_id', params.expoId);

  const rows = transformations || [];

  // Summary
  const uniqueMobiles = new Set(rows.map(r => r.mobile_number));
  const uniqueGroups = new Set(rows.filter(r => r.group_id).map(r => r.group_id));

  const summary = {
    total_photos: rows.length,
    unique_visitors: uniqueMobiles.size,
    total_groups: uniqueGroups.size,
    avg_photos_per_visitor: uniqueMobiles.size > 0
      ? Math.round((rows.length / uniqueMobiles.size) * 10) / 10
      : 0,
  };

  // Theme type breakdown
  const typeMap = new Map<string, number>();
  rows.forEach(r => {
    typeMap.set(r.theme_type, (typeMap.get(r.theme_type) || 0) + 1);
  });
  const theme_breakdown = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Top themes
  const themeMap = new Map<string, { theme: string; type: string; count: number }>();
  rows.forEach(r => {
    const key = r.selected_theme;
    if (!themeMap.has(key)) {
      themeMap.set(key, { theme: key, type: r.theme_type, count: 0 });
    }
    themeMap.get(key)!.count++;
  });
  const top_themes = Array.from(themeMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Group breakdown
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name')
    .eq('expo_id', params.expoId)
    .eq('is_active', true);

  const groupMap = new Map<string, { id: string; name: string; photo_count: number; visitor_count: number }>();
  (groups || []).forEach(g => {
    groupMap.set(g.id, { id: g.id, name: g.name, photo_count: 0, visitor_count: 0 });
  });

  const groupVisitors = new Map<string, Set<string>>();
  rows.forEach(r => {
    if (r.group_id && groupMap.has(r.group_id)) {
      groupMap.get(r.group_id)!.photo_count++;
      if (!groupVisitors.has(r.group_id)) groupVisitors.set(r.group_id, new Set());
      groupVisitors.get(r.group_id)!.add(r.mobile_number);
    }
  });
  groupVisitors.forEach((visitors, gId) => {
    if (groupMap.has(gId)) groupMap.get(gId)!.visitor_count = visitors.size;
  });

  const group_breakdown = Array.from(groupMap.values())
    .sort((a, b) => b.photo_count - a.photo_count);

  // Daily activity
  const dailyMap = new Map<string, number>();
  rows.forEach(r => {
    const day = r.created_at.split('T')[0];
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  });
  const daily_activity = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    expo,
    summary,
    theme_breakdown,
    top_themes,
    group_breakdown,
    daily_activity,
  });
}
