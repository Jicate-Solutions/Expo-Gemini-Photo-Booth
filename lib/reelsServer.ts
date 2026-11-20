/**
 * Server-only helpers for the Reels Contest API.
 */
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_CODE_PREFIX, DEFAULT_TAG_HANDLES } from '@/lib/reels';

export interface ReelsExpo {
  id: string;
  name: string;
  codePrefix: string;
  handles: string[];
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The expo opened by the short printed QR address (/reels):
 * REELS_EXPO_ID if set (pinned on Vercel), otherwise the newest active marathon expo.
 */
export async function getDefaultReelsExpoId(): Promise<string | null> {
  const pinned = process.env.REELS_EXPO_ID?.trim();
  if (pinned) return pinned;
  const { data } = await createClient()
    .from('expos')
    .select('id')
    .eq('is_active', true)
    .eq('metadata->>mode', 'marathon')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Admin check for reels admin APIs: the admin dashboard sends its session token
 * (the admin user's id) in the x-admin-token header; it must belong to an active admin.
 */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const token = req.headers.get('x-admin-token')?.trim() ?? '';
  if (!UUID_RE.test(token)) return false;
  const { data } = await createClient()
    .from('admin_users')
    .select('id')
    .eq('id', token)
    .eq('is_active', true)
    .maybeSingle();
  return !!data;
}

/**
 * The expo behind a reels QR link — only active expos with the contest switched on
 * (marathon expos, or metadata.reels_enabled = true).
 */
export async function getReelsExpo(expoId: string): Promise<ReelsExpo | null> {
  if (!UUID_RE.test(expoId)) return null;
  const { data } = await createClient()
    .from('expos')
    .select('id, name, is_active, metadata')
    .eq('id', expoId)
    .maybeSingle();
  if (!data || !data.is_active) return null;

  const meta = (data.metadata ?? {}) as Record<string, unknown>;
  if (meta.mode !== 'marathon' && meta.reels_enabled !== true) return null;

  const prefix =
    typeof meta.reels_code_prefix === 'string' && /^[A-Z0-9]{2,12}$/.test(meta.reels_code_prefix)
      ? meta.reels_code_prefix
      : DEFAULT_CODE_PREFIX;
  const handles =
    Array.isArray(meta.reels_handles) && meta.reels_handles.every(h => typeof h === 'string')
      ? (meta.reels_handles as string[])
      : DEFAULT_TAG_HANDLES;

  return { id: data.id, name: data.name, codePrefix: prefix, handles };
}
