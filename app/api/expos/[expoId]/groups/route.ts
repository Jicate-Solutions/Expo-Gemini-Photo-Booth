import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: { expoId: string };
}

// GET: List groups for an expo
export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('groups')
    .select('id, name, is_active, created_at')
    .eq('expo_id', params.expoId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// POST: Add groups (accepts array of names)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { names } = await req.json();

    if (!names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json({ error: 'names array is required' }, { status: 400 });
    }

    const supabase = createClient();

    const rows = names
      .filter((n: string) => n.trim())
      .map((n: string) => ({ expo_id: params.expoId, name: n.trim() }));

    const { data, error } = await supabase
      .from('groups')
      .upsert(rows, { onConflict: 'expo_id,name' })
      .select('id, name, is_active');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] }, { status: 201 });
  } catch (e) {
    console.error('Create groups error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Soft-delete a specific group
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { groupId } = await req.json();

  if (!groupId) {
    return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('groups')
    .update({ is_active: false })
    .eq('id', groupId)
    .eq('expo_id', params.expoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
