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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
