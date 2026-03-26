import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth';

// GET: List all expos
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const activeOnly = req.nextUrl.searchParams.get('active') === 'true';

  let query = supabase
    .from('expos')
    .select('id, name, venue, start_date, end_date, username, is_active, created_at, updated_at, metadata')
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// POST: Create a new expo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, venue, start_date, end_date, username, password, groups } = body;

    if (!name || !start_date || !end_date || !username || !password) {
      return NextResponse.json(
        { error: 'name, start_date, end_date, username, and password are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('expos')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);

    const { data: expo, error } = await supabase
      .from('expos')
      .insert({
        name,
        venue: venue || null,
        start_date,
        end_date,
        username: username.toLowerCase().trim(),
        password_hash,
        is_active: true,
      })
      .select('id, name, venue, start_date, end_date, username, is_active')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create groups if provided
    if (groups && Array.isArray(groups) && groups.length > 0) {
      const groupRows = groups
        .filter((g: string) => g.trim())
        .map((g: string) => ({ expo_id: expo.id, name: g.trim() }));

      if (groupRows.length > 0) {
        await supabase.from('groups').insert(groupRows);
      }
    }

    return NextResponse.json({ data: expo }, { status: 201 });
  } catch (e) {
    console.error('Create expo error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
