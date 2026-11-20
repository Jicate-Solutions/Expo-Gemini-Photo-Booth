import type { Metadata } from 'next';
import ReelsApp from '@/components/reels/ReelsApp';
import { getDefaultReelsExpoId } from '@/lib/reelsServer';

export const metadata: Metadata = {
  title: 'Impact Reel Challenge · Erode Marathon 2026',
  description: 'Register for the reels contest — Running for a Drug-Free Tamil Nadu.',
};

// Always look up the current contest (never cache the expo choice at build time)
export const dynamic = 'force-dynamic';

/**
 * Short, permanent address printed on the QR code: /reels
 * Opens REELS_EXPO_ID if set, otherwise the newest active marathon expo.
 */
export default async function ReelsShortPage() {
  const expoId = await getDefaultReelsExpoId();
  // ReelsApp shows a friendly "not active" message if no contest is found
  return <ReelsApp expoId={expoId || 'none'} />;
}
