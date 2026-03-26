import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth';

interface RouteParams {
  params: { expoId: string };
}

// GET: Single expo with its groups
export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();

  const { data: expo, error } = await supabase
    .from('expos')
    .select('id, name, venue, start_date, end_date, username, is_active, created_at, metadata')
    .eq('id', params.expoId)
    .single();

  if (error || !expo) {
    return NextResponse.json({ error: 'Expo not found' }, { status: 404 });
  }

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, is_active, created_at')
    .eq('expo_id', params.expoId)
    .eq('is_active', true)
    .order('name');

  return NextResponse.json({ data: { ...expo, groups: groups || [] } });
}

// PUT: Update expo
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();
    const supabase = createClient();

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name;
    if (body.venue !== undefined) updates.venue = body.venue;
    if (body.start_date) updates.start_date = body.start_date;
    if (body.end_date) updates.end_date = body.end_date;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.password) updates.password_hash = await hashPassword(body.password);

    const { data, error } = await supabase
      .from('expos')
      .update(updates)
      .eq('id', params.expoId)
      .select('id, name, venue, start_date, end_date, username, is_active')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    console.error('Update expo error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Soft-delete expo
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('expos')
      .update({ is_active: false })
      .eq('id', params.expoId);

    if (error) {
      console.error('Delete expo error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete expo exception:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
