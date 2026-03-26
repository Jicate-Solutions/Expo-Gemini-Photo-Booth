# Expo Tracking & Statistics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Add per-expo scoped authentication, group tracking, and statistics dashboards so each expo gets unique credentials, sees only their own data, and admin gets full analytics with advanced filters.

**Architecture:** Replace hardcoded booth logins with DB-stored expo credentials (bcrypt). Each expo has one username/password. Login resolves the expo context automatically — no manual "pick your expo" step. Add `expos` and `groups` tables with FKs to existing `user_transformations`. Admin gets a multi-expo dashboard with drill-down stats and advanced filters. Expo users get booth operation + their own stats view.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres + Storage), TypeScript, Tailwind CSS, shadcn/ui, bcryptjs, Zod validation

---

## Phase 1: Database Foundation & Security

### Task 1: Install bcryptjs dependency

**Files:**
- Modify: `package.json`

**Step 1: Install bcryptjs**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

**Step 2: Verify installation**

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('test', 10))"
```

Expected: A bcrypt hash string starting with `$2a$`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add bcryptjs for password hashing"
```

---

### Task 2: Create Supabase tables via SQL migration

**Files:**
- Create: `supabase/migrations/001_expo_tracking.sql`

**Step 1: Create the migration file**

Create `supabase/migrations/001_expo_tracking.sql`:

```sql
-- ============================================================
-- MIGRATION 001: Expo Tracking & Scoped Authentication
-- ============================================================

-- 1. Admin users table (replaces hardcoded admin password)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Expos table (each expo gets its own login credentials)
CREATE TABLE IF NOT EXISTS public.expos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    venue TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Groups table (groups/cohorts within an expo)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expo_id UUID NOT NULL REFERENCES public.expos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (expo_id, name)
);

-- 4. Add expo/group FKs to existing user_transformations (nullable for legacy data)
ALTER TABLE public.user_transformations
    ADD COLUMN IF NOT EXISTS expo_id UUID REFERENCES public.expos(id),
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id);

-- 5. Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_transformations_expo ON public.user_transformations(expo_id);
CREATE INDEX IF NOT EXISTS idx_transformations_group ON public.user_transformations(group_id);
CREATE INDEX IF NOT EXISTS idx_transformations_expo_created ON public.user_transformations(expo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transformations_expo_group ON public.user_transformations(expo_id, group_id);
CREATE INDEX IF NOT EXISTS idx_transformations_expo_theme ON public.user_transformations(expo_id, theme_type, selected_theme);
CREATE INDEX IF NOT EXISTS idx_groups_expo ON public.groups(expo_id);
CREATE INDEX IF NOT EXISTS idx_expos_dates ON public.expos(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_expos_username ON public.expos(username);

-- 6. RLS policies (deny anon access to all tables)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_transformations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon read" ON public.admin_users FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon write" ON public.admin_users FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon read" ON public.expos FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon write" ON public.expos FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon read" ON public.groups FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon write" ON public.groups FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon read" ON public.user_transformations FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon write" ON public.user_transformations FOR INSERT TO anon WITH CHECK (false);

-- Allow service_role full access (it bypasses RLS by default, but explicit for clarity)
CREATE POLICY "Service role full access" ON public.admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.expos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.groups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.user_transformations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Updated_at trigger for expos
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_expos_updated_at
    BEFORE UPDATE ON public.expos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

**Step 2: Run this SQL in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run the entire migration.

Verify by checking:
- Tables tab shows: `admin_users`, `expos`, `groups` (new) + `user_transformations` (modified)
- `user_transformations` has new columns: `expo_id`, `group_id`

**Step 3: Commit**

```bash
mkdir -p supabase/migrations
git add supabase/migrations/001_expo_tracking.sql
git commit -m "feat: add expo tracking database schema with RLS"
```

---

### Task 3: Seed admin user and legacy expo

**Files:**
- Create: `supabase/migrations/002_seed_admin.sql`

**Step 1: Create the seed migration**

Create `supabase/migrations/002_seed_admin.sql`:

```sql
-- ============================================================
-- SEED: Initial admin user and legacy expo for existing data
-- ============================================================

-- 1. Create default admin user (password: Maha@2026 → bcrypt hash)
-- Generate hash with: node -e "console.log(require('bcryptjs').hashSync('Maha@2026', 10))"
-- Replace the hash below with your generated hash
INSERT INTO public.admin_users (email, password_hash, display_name)
VALUES (
    'admin@jicate.com',
    '$2a$10$REPLACE_WITH_ACTUAL_HASH',
    'Admin'
) ON CONFLICT (email) DO NOTHING;

-- 2. Create "Legacy" expo for existing data (pre-tracking records)
INSERT INTO public.expos (id, name, venue, start_date, end_date, username, password_hash, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Pre-Tracking (Legacy)',
    'Various',
    '2025-01-01',
    '2026-03-26',
    'legacy',
    '$2a$10$REPLACE_WITH_DUMMY_HASH',
    false
) ON CONFLICT DO NOTHING;

-- 3. Migrate existing organization values into groups under legacy expo
INSERT INTO public.groups (expo_id, name)
SELECT DISTINCT
    'a0000000-0000-0000-0000-000000000001',
    TRIM(organization)
FROM public.user_transformations
WHERE organization IS NOT NULL
  AND TRIM(organization) != ''
ON CONFLICT (expo_id, name) DO NOTHING;

-- 4. Back-fill expo_id on all existing rows
UPDATE public.user_transformations
SET expo_id = 'a0000000-0000-0000-0000-000000000001'
WHERE expo_id IS NULL;

-- 5. Back-fill group_id where organization matches
UPDATE public.user_transformations ut
SET group_id = g.id
FROM public.groups g
WHERE g.expo_id = 'a0000000-0000-0000-0000-000000000001'
  AND TRIM(ut.organization) = g.name
  AND ut.group_id IS NULL;
```

**Step 2: Generate the actual bcrypt hash and update the file**

```bash
node -e "console.log(require('bcryptjs').hashSync('Maha@2026', 10))"
```

Copy the output hash and replace `$2a$10$REPLACE_WITH_ACTUAL_HASH` in the SQL file.
Also generate a dummy hash for the legacy expo and replace `$2a$10$REPLACE_WITH_DUMMY_HASH`.

**Step 3: Run in Supabase SQL Editor**

Verify:
- `admin_users` has 1 row
- `expos` has 1 row (Legacy)
- `groups` has rows matching your distinct organization values
- `user_transformations` rows now have `expo_id` and `group_id` populated

**Step 4: Commit**

```bash
git add supabase/migrations/002_seed_admin.sql
git commit -m "feat: seed admin user and migrate existing data to legacy expo"
```

---

### Task 4: Add shared TypeScript types

**Files:**
- Modify: `types/index.ts`

**Step 1: Add new types to `types/index.ts`**

Append the following to the existing file (keep all existing types unchanged):

```typescript
// ── Expo Tracking Types ──

export interface Expo {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  username: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface Group {
  id: string;
  created_at: string;
  expo_id: string;
  name: string;
  is_active: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
}

// Session info stored client-side after login
export interface BoothSession {
  type: 'expo' | 'admin';
  expoId: string;
  expoName: string;
  username: string;
  sessionToken: string; // random UUID for server validation
}

// Stats response types
export interface ExpoStats {
  expo: Pick<Expo, 'id' | 'name' | 'venue' | 'start_date' | 'end_date'>;
  summary: {
    total_photos: number;
    unique_visitors: number;
    total_groups: number;
    avg_photos_per_visitor: number;
  };
  theme_breakdown: { type: string; count: number }[];
  top_themes: { theme: string; type: string; count: number }[];
  group_breakdown: { id: string; name: string; photo_count: number; visitor_count: number }[];
  daily_activity: { date: string; count: number }[];
}

export interface ExpoOverview {
  id: string;
  name: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  total_photos: number;
  unique_visitors: number;
  group_count: number;
}
```

**Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add TypeScript types for expo tracking"
```

---

## Phase 2: Authentication System Rewrite

### Task 5: Create shared auth utility

**Files:**
- Create: `lib/auth.ts`

**Step 1: Create `lib/auth.ts`**

```typescript
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Authenticate an expo user by username/password.
 * Returns the expo record if valid, null otherwise.
 */
export async function authenticateExpo(username: string, password: string) {
  const supabase = createClient();

  const { data: expo } = await supabase
    .from('expos')
    .select('id, name, venue, start_date, end_date, username, password_hash, is_active')
    .eq('username', username.toLowerCase().trim())
    .eq('is_active', true)
    .single();

  if (!expo) return null;

  const valid = await verifyPassword(password, expo.password_hash);
  if (!valid) return null;

  // Don't leak password_hash
  const { password_hash, ...safeExpo } = expo;
  return safeExpo;
}

/**
 * Authenticate admin by email/password.
 * Returns the admin record if valid, null otherwise.
 */
export async function authenticateAdmin(email: string, password: string) {
  const supabase = createClient();

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, email, display_name, password_hash, is_active')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .single();

  if (!admin) return null;

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) return null;

  const { password_hash, ...safeAdmin } = admin;
  return safeAdmin;
}
```

**Step 2: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add auth utility with bcrypt and Supabase lookup"
```

---

### Task 6: Rewrite booth login API (unified login for expo users)

**Files:**
- Modify: `app/api/booth-login/route.ts`

**Step 1: Replace the entire file**

Replace `app/api/booth-login/route.ts` with:

```typescript
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
```

**Key changes:**
- No more hardcoded credentials
- Looks up `expos` table by username
- Uses bcrypt to verify password
- Returns expo context (id, name) with a session token
- Login field is now `username` instead of `email`

**Step 2: Commit**

```bash
git add app/api/booth-login/route.ts
git commit -m "feat: rewrite booth login to use DB-stored expo credentials"
```

---

### Task 7: Rewrite admin login API

**Files:**
- Modify: `app/api/admin/route.ts`

**Step 1: Replace the entire file**

Replace `app/api/admin/route.ts` with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth';

// POST: Admin login OR fetch data (based on request body)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createClient();

    // If body has email+password, it's a login attempt
    if (body.email && body.password) {
      const admin = await authenticateAdmin(body.email, body.password);
      if (!admin) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      return NextResponse.json({ success: true, admin });
    }

    // If body has adminToken, it's a data fetch (for now, just check it's truthy)
    // In production, you'd validate this token server-side
    if (!body.adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch data with optional expo filter
    let query = supabase
      .from('user_transformations')
      .select('*')
      .order('created_at', { ascending: false });

    if (body.expoId) {
      query = query.eq('expo_id', body.expoId);
    }

    if (body.groupId) {
      query = query.eq('group_id', body.groupId);
    }

    // Pagination: default 100, max 500
    const limit = Math.min(body.limit || 100, 500);
    const offset = body.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await supabase
      .from('user_transformations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
```

**Step 2: Commit**

```bash
git add app/api/admin/route.ts
git commit -m "feat: rewrite admin API with DB auth and expo filtering"
```

---

### Task 8: Modify save-user API to include expo/group context

**Files:**
- Modify: `app/api/save-user/route.ts`

**Step 1: Replace the entire file**

Replace `app/api/save-user/route.ts` with:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const {
      name, mobile, group, theme, themeType, careerStyle,
      photoUrl, originalPhoto,
      expoId, groupId, // NEW: expo context from client session
    } = await req.json();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_transformations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        name,
        organization: group || '',
        email: '',
        mobile_number: mobile,
        selected_theme: theme,
        theme_type: themeType,
        career_style: themeType === 'career' ? careerStyle : null,
        transformed_photo_url: photoUrl || '',
        original_photo_url: (originalPhoto || '').substring(0, 100),
        expo_id: expoId || null,
        group_id: groupId || null,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('DB save failed:', err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Save user exception:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

**Key change:** Accepts `expoId` and `groupId` from the client session and writes them to the DB.

**Step 2: Commit**

```bash
git add app/api/save-user/route.ts
git commit -m "feat: save-user now writes expo_id and group_id to transformations"
```

---

## Phase 3: Expo CRUD API

### Task 9: Create expo management API routes

**Files:**
- Create: `app/api/expos/route.ts`
- Create: `app/api/expos/[expoId]/route.ts`
- Create: `app/api/expos/[expoId]/groups/route.ts`

**Step 1: Create `app/api/expos/route.ts` (List + Create)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth';

// GET: List all expos (optionally filter by active)
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
```

**Step 2: Create `app/api/expos/[expoId]/route.ts` (Get + Update + Delete)**

```typescript
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

// DELETE: Soft-delete (deactivate) expo
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient();

  const { error } = await supabase
    .from('expos')
    .update({ is_active: false })
    .eq('id', params.expoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 3: Create `app/api/expos/[expoId]/groups/route.ts` (List + Create + Delete groups)**

```typescript
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

// POST: Add groups to an expo (accepts array of names)
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
```

**Step 4: Commit**

```bash
git add app/api/expos/
git commit -m "feat: add expo and group CRUD API routes"
```

---

## Phase 4: Statistics API

### Task 10: Create expo statistics API

**Files:**
- Create: `app/api/expos/[expoId]/stats/route.ts`
- Create: `app/api/stats/overview/route.ts`

**Step 1: Create `app/api/expos/[expoId]/stats/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // Calculate summary
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
```

**Step 2: Create `app/api/stats/overview/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();

  // Fetch all expos
  const { data: expos } = await supabase
    .from('expos')
    .select('id, name, venue, start_date, end_date, is_active')
    .order('start_date', { ascending: false });

  if (!expos || expos.length === 0) {
    return NextResponse.json({ expos: [], totals: { total_expos: 0, total_photos: 0, total_visitors: 0 } });
  }

  // Fetch all transformations with expo grouping
  const { data: transformations } = await supabase
    .from('user_transformations')
    .select('expo_id, mobile_number');

  const rows = transformations || [];

  // Build per-expo stats
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

  // Fetch group counts per expo
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
```

**Step 3: Commit**

```bash
git add app/api/expos/[expoId]/stats/ app/api/stats/
git commit -m "feat: add expo statistics and overview API endpoints"
```

---

## Phase 5: Frontend - Booth Login & Session

### Task 11: Update BoothLoginScreen for username-based login

**Files:**
- Modify: `components/booth/BoothLoginScreen.tsx`

**Step 1: Update the component**

Key changes to `components/booth/BoothLoginScreen.tsx`:
- Change `email` field to `username` field
- Update `onLogin` callback to pass the session data
- Update form labels and placeholders

Change the interface and state:

```typescript
// OLD
interface BoothLoginScreenProps {
  onLogin: () => void;
}
// ...
const [email, setEmail] = useState('');

// NEW
interface BoothLoginScreenProps {
  onLogin: (session: { type: 'expo'; expoId: string; expoName: string; username: string; sessionToken: string }) => void;
}
// ...
const [username, setUsername] = useState('');
```

Change the handleSubmit:

```typescript
// OLD
const res = await fetch('/api/booth-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!res.ok) { /* ... */ }
onLogin();

// NEW
const res = await fetch('/api/booth-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
const data = await res.json();
if (!res.ok) {
  setError(data.error || 'Invalid credentials');
  return;
}
onLogin(data.session);
```

Change the email input to username:

```typescript
// OLD
<label>Email Address</label>
<input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />

// NEW
<label>Expo Username</label>
<input type="text" placeholder="Enter expo username" value={username} onChange={e => setUsername(e.target.value)} />
```

Change the submit button disabled check:

```typescript
// OLD
disabled={loading || !email || !password}

// NEW
disabled={loading || !username || !password}
```

**Step 2: Commit**

```bash
git add components/booth/BoothLoginScreen.tsx
git commit -m "feat: update booth login for username-based expo authentication"
```

---

### Task 12: Update PhotoBooth component to carry expo session

**Files:**
- Modify: `components/PhotoBooth.tsx`
- Modify: `types/index.ts` (update AppState)

**Step 1: Add `BoothSession` to AppState in `types/index.ts`**

Update the `AppState` interface:

```typescript
export interface AppState {
  screen: AppScreen;
  capturedPhoto: string | null;
  selectedTheme: Theme | null;
  careerStyle: CareerStyle;
  customPrompt: string;
  transformedImageUrl: string | null;
  userInfo: UserInfo | null;
  errorMessage: string;
  referenceImages: string[];
}
```

No change needed to AppState itself — the session lives in a separate state variable.

**Step 2: Update `components/PhotoBooth.tsx`**

Add session state and pass expo context to save-user:

```typescript
// Add import
import { BoothSession } from '@/types';

// Add state (after boothLoggedIn state)
const [session, setSession] = useState<BoothSession | null>(null);

// Update booth login check on mount
useEffect(() => {
  const saved = sessionStorage.getItem('booth_session_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as BoothSession;
      setSession(parsed);
      setBoothLoggedIn(true);
    } catch { /* ignore */ }
  }
}, []);

// Update the onLogin handler for BoothLoginScreen
const handleBoothLogin = (sessionData: BoothSession) => {
  setSession(sessionData);
  setBoothLoggedIn(true);
  sessionStorage.setItem('booth_session_data', JSON.stringify(sessionData));
  sessionStorage.setItem('booth_logged_in', 'true');
};
```

Update the save-user fetch call (around line 142-156) to include expo context:

```typescript
// Change the save-user fetch body to include session context
fetch('/api/save-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: state.userInfo.name,
    mobile: state.userInfo.mobile,
    group: state.userInfo.group,
    theme: themeTitle,
    themeType,
    careerStyle,
    photoUrl: photoPublicUrl,
    originalPhoto: state.capturedPhoto,
    expoId: session?.expoId || null,    // NEW
    groupId: state.userInfo.groupId || null, // NEW
  }),
}).catch(e => console.error('Save user failed:', e));
```

Update the BoothLoginScreen rendering:

```typescript
// OLD
if (!boothLoggedIn) {
  return <BoothLoginScreen onLogin={() => { setBoothLoggedIn(true); sessionStorage.setItem('booth_logged_in', 'true'); }} />;
}

// NEW
if (!boothLoggedIn) {
  return <BoothLoginScreen onLogin={handleBoothLogin} />;
}
```

Update the clearSession to also clear the booth session:

```typescript
const clearSession = () => {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('booth_session_data');
  sessionStorage.removeItem('booth_logged_in');
  setState(initialState);
  setSession(null);
  setBoothLoggedIn(false);
};
```

**Step 3: Commit**

```bash
git add components/PhotoBooth.tsx types/index.ts
git commit -m "feat: PhotoBooth carries expo session and passes context to save-user"
```

---

### Task 13: Update UserInfoScreen with searchable group dropdown

**Files:**
- Modify: `components/booth/UserInfoScreen.tsx`
- Modify: `types/index.ts` (add groupId to UserInfo)

**Step 1: Update UserInfo type in `types/index.ts`**

```typescript
export interface UserInfo {
  name: string;
  mobile: string;
  group: string;
  groupId?: string; // NEW: FK to groups table
}
```

**Step 2: Replace group input in `components/booth/UserInfoScreen.tsx`**

Update the component to accept groups list and render a searchable dropdown:

```typescript
'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, User, Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserInfo } from '@/types';

interface GroupOption {
  id: string;
  name: string;
}

interface UserInfoScreenProps {
  capturedPhoto: string;
  groups: GroupOption[];
  onNext: (info: UserInfo) => void;
  onBack: () => void;
}

export default function UserInfoScreen({ capturedPhoto, groups, onNext, onBack }: UserInfoScreenProps) {
  const [form, setForm] = useState<UserInfo>({ name: '', mobile: '', group: '', groupId: undefined });
  const [errors, setErrors] = useState<Partial<Record<keyof UserInfo, string>>>({});
  const [groupSearch, setGroupSearch] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const validate = () => {
    const e: Partial<Record<keyof UserInfo, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'WhatsApp number is required';
    if (!form.group.trim()) e.group = 'Group is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const selectGroup = (g: GroupOption) => {
    setForm({ ...form, group: g.name, groupId: g.id });
    setShowGroupDropdown(false);
    setShowOtherInput(false);
    setGroupSearch('');
  };

  const selectOther = () => {
    setForm({ ...form, group: '', groupId: undefined });
    setShowGroupDropdown(false);
    setShowOtherInput(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(form);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/30 via-gray-950 to-gray-950 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-pink-600/8 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10 flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Your Details</h1>
      </header>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 p-6 lg:p-8 overflow-y-auto">
        {/* Photo preview */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-purple-600/20 blur-xl" />
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_40px_rgba(139,92,246,0.25)]">
              <img src={capturedPhoto} alt="Your photo" className="w-full h-full object-cover" />
            </div>
          </div>
          <p className="text-center text-purple-400/70 text-sm mt-3">Your photo is ready</p>
        </div>

        {/* Form */}
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600/30 to-pink-600/20 border border-purple-500/40 rounded-xl flex items-center justify-center shadow-[0_0_14px_rgba(139,92,246,0.2)]">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Tell us about yourself</h2>
                <p className="text-gray-500 text-sm">A few details before your transformation</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Full Name *</label>
                <Input
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50"
                  autoComplete="off"
                  name="booth-name"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">WhatsApp Number *</label>
                <Input
                  type="tel"
                  placeholder="Enter your 10-digit number"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50"
                  autoComplete="off"
                  name="booth-mobile"
                />
                {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile}</p>}
              </div>

              {/* Group Searchable Dropdown */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Group *</label>

                {groups.length > 0 && !showOtherInput ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                      className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left focus:border-purple-500/50 transition-colors"
                    >
                      <span className={form.group ? 'text-white' : 'text-gray-600'}>
                        {form.group || 'Select your group'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showGroupDropdown && (
                      <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        {/* Search */}
                        <div className="p-2 border-b border-white/10">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search groups..."
                              value={groupSearch}
                              onChange={e => setGroupSearch(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                              autoFocus
                            />
                          </div>
                        </div>
                        {/* Options */}
                        <div className="max-h-48 overflow-y-auto">
                          {filteredGroups.map(g => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => selectGroup(g)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-purple-500/10 transition-colors"
                            >
                              {form.groupId === g.id ? (
                                <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="text-white">{g.name}</span>
                            </button>
                          ))}
                          {filteredGroups.length === 0 && (
                            <p className="px-4 py-3 text-sm text-gray-500">No groups found</p>
                          )}
                        </div>
                        {/* Other option */}
                        <div className="border-t border-white/10">
                          <button
                            type="button"
                            onClick={selectOther}
                            className="w-full px-4 py-2.5 text-sm text-left text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            Other (type your group)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter your group name"
                      value={form.group}
                      onChange={(e) => setForm({ ...form, group: e.target.value, groupId: undefined })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50"
                      autoComplete="off"
                      name="booth-group"
                    />
                    {groups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setShowOtherInput(false); setForm({ ...form, group: '', groupId: undefined }); }}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Back to group list
                      </button>
                    )}
                  </div>
                )}
                {errors.group && <p className="text-red-400 text-xs mt-1">{errors.group}</p>}
              </div>

              <div className="relative pt-2">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 blur opacity-40" />
                <Button
                  type="submit"
                  className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white gap-2 py-6 text-base rounded-xl border-0"
                >
                  Continue to Themes
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Update PhotoBooth.tsx to fetch groups and pass them to UserInfoScreen**

Add a groups fetch effect and pass groups to UserInfoScreen:

```typescript
// Add state for groups
const [expoGroups, setExpoGroups] = useState<{ id: string; name: string }[]>([]);

// Fetch groups when session is set
useEffect(() => {
  if (!session?.expoId) return;
  fetch(`/api/expos/${session.expoId}/groups`)
    .then(r => r.json())
    .then(d => setExpoGroups(d.data || []))
    .catch(() => setExpoGroups([]));
}, [session?.expoId]);

// Pass groups to UserInfoScreen
<UserInfoScreen
  capturedPhoto={state.capturedPhoto!}
  groups={expoGroups}
  onNext={handleUserInfo}
  onBack={() => go('camera')}
/>
```

**Step 4: Commit**

```bash
git add components/booth/UserInfoScreen.tsx components/PhotoBooth.tsx types/index.ts
git commit -m "feat: searchable group dropdown in UserInfoScreen with expo-scoped groups"
```

---

## Phase 6: Admin Dashboard - Expo Management

### Task 14: Create admin dashboard with expo management

**Files:**
- Rewrite: `app/admin/page.tsx`

This is a significant rewrite. The new admin page has these sections:

1. **Login** (email + password against `admin_users` table)
2. **Expo List** (cards with key metrics per expo)
3. **Create/Edit Expo** (form with groups tag input)
4. **Expo Detail** (drill-down with stats, group breakdown, visitor list, advanced filters)
5. **Export** (CSV per expo)

**Due to the size of this component (500+ lines), implement it as multiple files:**

- Create: `app/admin/page.tsx` — main page (login + routing)
- Create: `components/admin/ExpoList.tsx` — expo cards grid
- Create: `components/admin/ExpoForm.tsx` — create/edit expo form
- Create: `components/admin/ExpoDetail.tsx` — single expo stats + visitors
- Create: `components/admin/AdminHeader.tsx` — header with navigation

**Step 1: Create `components/admin/AdminHeader.tsx`**

```typescript
'use client';

import { LogOut, RefreshCw, Plus, ArrowLeft } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  onRefresh?: () => void;
  onBack?: () => void;
  onCreateExpo?: () => void;
  refreshing?: boolean;
}

export default function AdminHeader({ title, subtitle, onLogout, onRefresh, onBack, onCreateExpo, refreshing }: AdminHeaderProps) {
  return (
    <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="font-bold text-xl text-white">{title}</h1>
          {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {onCreateExpo && (
          <button onClick={onCreateExpo}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Expo
          </button>
        )}
        {onRefresh && (
          <button onClick={onRefresh} disabled={refreshing}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
        <button onClick={onLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </header>
  );
}
```

**Step 2: Create `components/admin/ExpoList.tsx`**

```typescript
'use client';

import { Calendar, Users, Camera, MapPin } from 'lucide-react';
import { ExpoOverview } from '@/types';

interface ExpoListProps {
  expos: ExpoOverview[];
  onSelect: (expoId: string) => void;
}

export default function ExpoList({ expos, onSelect }: ExpoListProps) {
  if (expos.length === 0) {
    return (
      <div className="text-center py-20 text-gray-600">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No expos yet. Create your first expo to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {expos.map(expo => {
        const isActive = expo.is_active && new Date(expo.end_date) >= new Date();
        const isPast = new Date(expo.end_date) < new Date();

        return (
          <button
            key={expo.id}
            onClick={() => onSelect(expo.id)}
            className="text-left bg-white/5 hover:bg-white/8 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-white text-lg group-hover:text-purple-200 transition-colors">{expo.name}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isActive ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                isPast ? 'bg-gray-500/15 text-gray-400 border border-gray-500/20' :
                'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
              }`}>
                {isActive ? 'Active' : isPast ? 'Completed' : 'Upcoming'}
              </span>
            </div>

            {expo.venue && (
              <p className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                <MapPin className="w-3.5 h-3.5" /> {expo.venue}
              </p>
            )}

            <p className="text-gray-500 text-xs mb-4">
              {new Date(expo.start_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              {' — '}
              {new Date(expo.end_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-black text-white">{expo.total_photos}</div>
                <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                  <Camera className="w-3 h-3" /> Photos
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-white">{expo.unique_visitors}</div>
                <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Visitors
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-white">{expo.group_count}</div>
                <div className="text-gray-500 text-xs">Groups</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

**Step 3: Create `components/admin/ExpoForm.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExpoFormProps {
  onSave: (data: {
    name: string; venue: string; start_date: string; end_date: string;
    username: string; password: string; groups: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ExpoForm({ onSave, onCancel }: ExpoFormProps) {
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [groupInput, setGroupInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addGroup = () => {
    const trimmed = groupInput.trim();
    if (trimmed && !groups.includes(trimmed)) {
      setGroups([...groups, trimmed]);
      setGroupInput('');
    }
  };

  const removeGroup = (g: string) => setGroups(groups.filter(x => x !== g));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || !username || !password) {
      setError('All required fields must be filled');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ name, venue, start_date: startDate, end_date: endDate, username, password, groups });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Create New Expo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Expo Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TechFest Chennai 2026"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Venue</label>
            <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Chennai Trade Centre"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Start Date *</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">End Date *</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-sm font-semibold text-white mb-3">Expo Login Credentials</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Username *</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. techfest2026"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Password *</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a strong password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-sm font-semibold text-white mb-3">Groups ({groups.length})</p>
            <div className="flex gap-2 mb-3">
              <Input
                value={groupInput}
                onChange={e => setGroupInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGroup(); } }}
                placeholder="Type group name and press Enter"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 flex-1"
              />
              <Button type="button" onClick={addGroup} variant="outline" size="icon"
                className="border-white/10 text-gray-400 hover:text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <span key={g} className="inline-flex items-center gap-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/20 rounded-full px-3 py-1 text-sm">
                  {g}
                  <button type="button" onClick={() => removeGroup(g)} className="text-purple-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onCancel} variant="outline"
              className="flex-1 border-white/10 text-gray-400 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
              {saving ? 'Creating...' : 'Create Expo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: Create `components/admin/ExpoDetail.tsx`**

This is the largest component — shows stats, group breakdown, visitors, and filters for a single expo. Due to its complexity, this component renders:
- Stat cards row (photos, visitors, groups, avg photos/visitor)
- Theme breakdown pills
- Group breakdown table (sorted by photo count)
- Visitor list with expand/collapse per visitor
- CSV export button scoped to this expo

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Camera, Users, Briefcase, Star, Download, MessageCircle, ChevronDown, ChevronUp, Trash2, Search, Filter } from 'lucide-react';
import { ExpoStats } from '@/types';
import { Input } from '@/components/ui/input';

interface Row {
  id: string;
  created_at: string;
  name: string;
  organization: string;
  mobile_number: string;
  selected_theme: string;
  theme_type: string;
  career_style: string;
  transformed_photo_url: string;
}

interface ExpoDetailProps {
  expoId: string;
  adminToken: string;
}

export default function ExpoDetail({ expoId, adminToken }: ExpoDetailProps) {
  const [stats, setStats] = useState<ExpoStats | null>(null);
  const [visitors, setVisitors] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterThemeType, setFilterThemeType] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/expos/${expoId}/stats`).then(r => r.json()),
      fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken, expoId, limit: 500 }),
      }).then(r => r.json()),
    ]).then(([statsData, visitorsData]) => {
      setStats(statsData);
      setVisitors(visitorsData.data || []);
    }).finally(() => setLoading(false));
  }, [expoId, adminToken]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500">Loading stats...</div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-gray-500">Failed to load stats</div>;
  }

  // Build visitor map (group by mobile)
  const visitorMap = new Map<string, Row & { photoCount: number; photos: { url: string; theme: string; theme_type: string; created_at: string }[] }>();
  for (const row of visitors) {
    const key = row.mobile_number || row.id;
    if (!visitorMap.has(key)) {
      visitorMap.set(key, { ...row, photoCount: 0, photos: [] });
    }
    const v = visitorMap.get(key)!;
    v.photoCount++;
    if (row.transformed_photo_url && !row.transformed_photo_url.startsWith('data:')) {
      v.photos.push({ url: row.transformed_photo_url, theme: row.selected_theme, theme_type: row.theme_type, created_at: row.created_at });
    }
  }

  let filteredVisitors = Array.from(visitorMap.values());
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredVisitors = filteredVisitors.filter(v =>
      v.name.toLowerCase().includes(q) || v.mobile_number.includes(q) || v.organization.toLowerCase().includes(q)
    );
  }
  if (filterThemeType) {
    const matchingMobiles = new Set(visitors.filter(r => r.theme_type === filterThemeType).map(r => r.mobile_number));
    filteredVisitors = filteredVisitors.filter(v => matchingMobiles.has(v.mobile_number));
  }

  const downloadCSV = () => {
    const headers = ['#', 'Date', 'Name', 'Group', 'WhatsApp', 'Theme', 'Type', 'Photo URL'];
    const rows = visitors.map((r, i) => [
      i + 1, new Date(r.created_at).toLocaleString('en-IN'), r.name, r.organization || '',
      r.mobile_number, r.selected_theme, r.theme_type, r.transformed_photo_url || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stats.expo.name.replace(/\s+/g, '-')}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.summary.unique_visitors}</div>
            <div className="text-gray-500 text-xs">Unique Visitors</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.summary.total_photos}</div>
            <div className="text-gray-500 text-xs">Total Photos</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-600/20 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.summary.total_groups}</div>
            <div className="text-gray-500 text-xs">Groups</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.summary.avg_photos_per_visitor}</div>
            <div className="text-gray-500 text-xs">Avg Photos/Visitor</div>
          </div>
        </div>
      </div>

      {/* Group Breakdown */}
      {stats.group_breakdown.length > 0 && (
        <div className="px-6 pb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Group Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {stats.group_breakdown.map(g => (
              <div key={g.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="font-medium text-white text-sm truncate">{g.name}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{g.photo_count} photos</span>
                  <span>{g.visitor_count} visitors</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Themes */}
      <div className="px-6 pb-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Themes</h3>
        <div className="flex flex-wrap gap-2">
          {stats.top_themes.map(t => (
            <span key={t.theme} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              t.type === 'career' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20' :
              'bg-violet-500/15 text-violet-300 border border-violet-500/20'
            }`}>
              {t.type === 'career' ? 'Career' : 'Fun'}: {t.theme} ({t.count})
            </span>
          ))}
        </div>
      </div>

      {/* Filters + Export */}
      <div className="px-6 pb-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search name, mobile, group..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm"
          />
        </div>
        <select
          value={filterThemeType}
          onChange={e => setFilterThemeType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none"
        >
          <option value="">All Types</option>
          <option value="career">Career</option>
          <option value="fun">Fun</option>
          <option value="custom">Custom</option>
        </select>
        <button onClick={downloadCSV}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      {/* Visitor Table */}
      <div className="px-6 pb-8">
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Group</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Theme</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Photos</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Photo</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((row, i) => {
                  const phone = row.mobile_number?.replace(/\D/g, '') || '';
                  const waPhone = phone.length === 10 ? `91${phone}` : phone;
                  return (
                    <>
                      <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-gray-400">{row.organization || '—'}</td>
                        <td className="px-4 py-3">
                          {waPhone ? (
                            <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 font-medium">
                              <MessageCircle className="w-3.5 h-3.5" /> {row.mobile_number}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.theme_type === 'career' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20' :
                            'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                          }`}>
                            {row.theme_type === 'career' ? 'Career' : 'Fun'}: {row.selected_theme}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.photoCount > 1 ? (
                            <button
                              onClick={() => setExpandedMobile(expandedMobile === row.mobile_number ? null : row.mobile_number)}
                              className="inline-flex items-center gap-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full transition-colors">
                              {row.photoCount}
                              {expandedMobile === row.mobile_number ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : <span className="text-gray-500 text-xs">1</span>}
                        </td>
                        <td className="px-4 py-3">
                          {row.photos.length > 0 ? (
                            <a href={row.photos[0].url} target="_blank" rel="noopener noreferrer">
                              <img src={row.photos[0].url} alt={row.selected_theme}
                                className="w-10 h-10 object-cover rounded-lg border border-white/10 hover:border-purple-400/50 transition-colors" />
                            </a>
                          ) : <span className="text-gray-600 text-xs">No image</span>}
                        </td>
                      </tr>
                      {expandedMobile === row.mobile_number && row.photos.length > 1 && (
                        <tr key={`${row.id}-exp`} className="bg-white/3 border-b border-white/5">
                          <td colSpan={8} className="px-6 py-4">
                            <p className="text-gray-500 text-xs mb-3">All photos for {row.name}</p>
                            <div className="flex flex-wrap gap-3">
                              {row.photos.map((p, idx) => (
                                <a key={idx} href={p.url} target="_blank" rel="noopener noreferrer" className="group">
                                  <img src={p.url} alt={p.theme} className="w-20 h-20 object-cover rounded-xl border border-white/10 group-hover:border-purple-400/50" />
                                  <p className="mt-1 text-center text-xs text-gray-500">{p.theme}</p>
                                </a>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Rewrite `app/admin/page.tsx` to use the new components**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import ExpoList from '@/components/admin/ExpoList';
import ExpoForm from '@/components/admin/ExpoForm';
import ExpoDetail from '@/components/admin/ExpoDetail';
import { ExpoOverview } from '@/types';

type AdminView = 'login' | 'expos' | 'create-expo' | 'expo-detail';

export default function AdminPage() {
  const [view, setView] = useState<AdminView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState('');
  const [expos, setExpos] = useState<ExpoOverview[]>([]);
  const [selectedExpoId, setSelectedExpoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-login from session
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) {
      setAdminToken(saved);
      setView('expos');
      fetchExpos();
    }
    setLoading(false);
  }, []);

  const fetchExpos = async () => {
    try {
      const res = await fetch('/api/stats/overview');
      const data = await res.json();
      setExpos(data.expos || []);
    } catch { /* ignore */ }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid credentials'); return; }
      const token = data.admin.id;
      setAdminToken(token);
      sessionStorage.setItem('admin_token', token);
      setView('expos');
      await fetchExpos();
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setAdminToken('');
    setView('login');
    setExpos([]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpos();
    setRefreshing(false);
  };

  const handleCreateExpo = async (data: {
    name: string; venue: string; start_date: string; end_date: string;
    username: string; password: string; groups: string[];
  }) => {
    const res = await fetch('/api/expos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create expo');
    }
    setView('expos');
    await fetchExpos();
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>;
  }

  // ── LOGIN ──
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors">
              <LogOut className="w-4 h-4 rotate-180" /> Back to Booth
            </a>
            <div className="w-14 h-14 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-purple-400" />
            </div>
            <h1 className="text-white font-bold text-2xl">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">Expo Management Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50"
                autoComplete="off" />
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 pr-12"
                autoComplete="off" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Checking...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── MAIN DASHBOARD ──
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {view === 'expos' && (
        <>
          <AdminHeader
            title="Expo Dashboard"
            subtitle={`${expos.length} expos total`}
            onLogout={handleLogout}
            onRefresh={handleRefresh}
            onCreateExpo={() => setView('create-expo')}
            refreshing={refreshing}
          />
          <ExpoList expos={expos} onSelect={(id) => { setSelectedExpoId(id); setView('expo-detail'); }} />
        </>
      )}

      {view === 'create-expo' && (
        <>
          <AdminHeader title="Create Expo" onLogout={handleLogout} onBack={() => setView('expos')} />
          <ExpoForm onSave={handleCreateExpo} onCancel={() => setView('expos')} />
        </>
      )}

      {view === 'expo-detail' && selectedExpoId && (
        <>
          <AdminHeader
            title={expos.find(e => e.id === selectedExpoId)?.name || 'Expo Detail'}
            onLogout={handleLogout}
            onBack={() => setView('expos')}
          />
          <ExpoDetail expoId={selectedExpoId} adminToken={adminToken} />
        </>
      )}
    </div>
  );
}
```

**Step 6: Commit**

```bash
mkdir -p components/admin
git add components/admin/ app/admin/page.tsx
git commit -m "feat: complete admin dashboard with expo management, stats, and filters"
```

---

## Phase 7: Expo User Stats View

### Task 15: Add stats tab for expo booth users

**Files:**
- Create: `components/booth/ExpoStatsView.tsx`
- Modify: `components/PhotoBooth.tsx`

**Step 1: Create `components/booth/ExpoStatsView.tsx`**

A simpler version of ExpoDetail that shows the expo user their own stats. Reuses the stats API endpoint.

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Camera, Users, BarChart3, ArrowLeft } from 'lucide-react';
import { ExpoStats } from '@/types';

interface ExpoStatsViewProps {
  expoId: string;
  expoName: string;
  onBack: () => void;
}

export default function ExpoStatsView({ expoId, expoName, onBack }: ExpoStatsViewProps) {
  const [stats, setStats] = useState<ExpoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/expos/${expoId}/stats`)
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [expoId]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading stats...</div>;
  if (!stats) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Failed to load</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="font-bold text-xl">{expoName} Stats</h1>
          <p className="text-gray-500 text-xs">{stats.expo.start_date} — {stats.expo.end_date}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 p-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <Camera className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-3xl font-black">{stats.summary.total_photos}</div>
          <div className="text-gray-500 text-xs">Photos</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-3xl font-black">{stats.summary.unique_visitors}</div>
          <div className="text-gray-500 text-xs">Visitors</div>
        </div>
      </div>

      {stats.group_breakdown.length > 0 && (
        <div className="px-6 pb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Groups</h3>
          {stats.group_breakdown.map(g => (
            <div key={g.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mb-2">
              <span className="text-white font-medium">{g.name}</span>
              <span className="text-gray-400 text-sm">{g.photo_count} photos · {g.visitor_count} visitors</span>
            </div>
          ))}
        </div>
      )}

      {stats.top_themes.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Themes</h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_themes.map(t => (
              <span key={t.theme} className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                {t.theme} ({t.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add stats toggle to `PhotoBooth.tsx`**

Add a "View Stats" button on the LandingScreen and a state to toggle between booth and stats:

```typescript
// Add state
const [showStats, setShowStats] = useState(false);

// Add to the component render (before the screen switch)
if (showStats && session) {
  return (
    <ExpoStatsView
      expoId={session.expoId}
      expoName={session.expoName}
      onBack={() => setShowStats(false)}
    />
  );
}
```

Pass `onShowStats` to LandingScreen and add a small "View Stats" button there.

**Step 3: Commit**

```bash
git add components/booth/ExpoStatsView.tsx components/PhotoBooth.tsx
git commit -m "feat: expo users can view their own stats from the booth"
```

---

## Phase 8: Landing Screen Expo Badge + Logout

### Task 16: Show active expo on landing screen

**Files:**
- Modify: `components/booth/LandingScreen.tsx`

**Step 1: Update LandingScreen to show expo badge**

Add props and render a small badge at the top:

```typescript
// Add to interface
interface LandingScreenProps {
  // ... existing props
  expoName?: string;
  onShowStats?: () => void;
  onLogout?: () => void;
}
```

Add a small header bar to the component:

```typescript
{expoName && (
  <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-sm border-b border-white/10">
    <span className="text-xs text-purple-300 font-medium">
      Active: {expoName}
    </span>
    <div className="flex items-center gap-2">
      {onShowStats && (
        <button onClick={onShowStats} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10">
          Stats
        </button>
      )}
      {onLogout && (
        <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-white/10">
          Logout
        </button>
      )}
    </div>
  </div>
)}
```

**Step 2: Pass the props from PhotoBooth.tsx**

```typescript
<LandingScreen
  // ... existing props
  expoName={session?.expoName}
  onShowStats={() => setShowStats(true)}
  onLogout={clearSession}
/>
```

**Step 3: Commit**

```bash
git add components/booth/LandingScreen.tsx components/PhotoBooth.tsx
git commit -m "feat: show active expo badge with stats and logout on landing screen"
```

---

## Summary: Complete File Manifest

### New Files (12)
| File | Purpose |
|------|---------|
| `supabase/migrations/001_expo_tracking.sql` | DB schema: expos, groups, admin_users, FKs, RLS |
| `supabase/migrations/002_seed_admin.sql` | Seed admin user + legacy expo migration |
| `lib/auth.ts` | bcrypt hashing + Supabase auth lookups |
| `app/api/expos/route.ts` | List + Create expos |
| `app/api/expos/[expoId]/route.ts` | Get + Update + Delete expo |
| `app/api/expos/[expoId]/groups/route.ts` | CRUD groups within expo |
| `app/api/expos/[expoId]/stats/route.ts` | Per-expo statistics |
| `app/api/stats/overview/route.ts` | Cross-expo overview |
| `components/admin/AdminHeader.tsx` | Admin dashboard header |
| `components/admin/ExpoList.tsx` | Expo cards grid |
| `components/admin/ExpoForm.tsx` | Create expo form with groups |
| `components/admin/ExpoDetail.tsx` | Single expo stats + visitors |
| `components/booth/ExpoStatsView.tsx` | Expo user stats view |

### Modified Files (8)
| File | Change |
|------|--------|
| `package.json` | Add bcryptjs |
| `types/index.ts` | Add Expo, Group, BoothSession, ExpoStats types |
| `app/api/booth-login/route.ts` | Username-based login against expos table |
| `app/api/admin/route.ts` | Email-based login against admin_users + expo filtering |
| `app/api/save-user/route.ts` | Accept and save expo_id + group_id |
| `components/booth/BoothLoginScreen.tsx` | Username field, return session data |
| `components/booth/UserInfoScreen.tsx` | Searchable group dropdown |
| `components/PhotoBooth.tsx` | Carry session, fetch groups, stats toggle |
| `components/booth/LandingScreen.tsx` | Expo badge + stats/logout buttons |
| `app/admin/page.tsx` | Complete rewrite with expo management |

### Deleted Files (0)
No files deleted — all changes are additive or in-place modifications.
