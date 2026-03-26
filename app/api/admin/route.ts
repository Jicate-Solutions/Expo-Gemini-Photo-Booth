import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createClient();

    // Login attempt
    if (body.email && body.password) {
      const admin = await authenticateAdmin(body.email, body.password);
      if (!admin) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      return NextResponse.json({ success: true, admin });
    }

    // Data fetch (requires adminToken)
    if (!body.adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = Math.min(body.limit || 100, 500);
    const offset = body.offset || 0;

    let query = supabase
      .from('user_transformations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (body.expoId) {
      query = query.eq('expo_id', body.expoId);
    }
    if (body.groupId) {
      query = query.eq('group_id', body.groupId);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ data: [], total: 0, tableError: error.message });
    }

    return NextResponse.json({ data: data || [], total: count || 0 });
  } catch (e) {
    console.error('Admin API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { adminToken, mobile } = await req.json();

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('user_transformations')
      .delete()
      .eq('mobile_number', mobile);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Admin delete error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
