import type { Metadata } from 'next';
import ReelsApp from '@/components/reels/ReelsApp';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Impact Reel Challenge · Erode Marathon 2026',
  description: 'Register for the reels contest — Running for a Drug-Free Tamil Nadu.',
};

// Always look up the current contest (never cache the expo choice at build time)
export const dynamic = 'force-dynamic';

/**
 * Short, permanent address printed on the QR code: /reels
 * Opens the contest for the reels expo — REELS_EXPO_ID if set, otherwise the newest
 * active marathon expo — so the printed QR keeps working even if the expo changes.
 */
export default async function ReelsShortPage() {
  let expoId = process.env.REELS_EXPO_ID || '';
  if (!expoId) {
    const { data } = await createClient()
      .from('expos')
      .select('id')
      .eq('is_active', true)
      .eq('metadata->>mode', 'marathon')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    expoId = data?.id ?? '';
  }
  // ReelsApp shows a friendly "not active" message if no contest is found
  return <ReelsApp expoId={expoId || 'none'} />;
}
