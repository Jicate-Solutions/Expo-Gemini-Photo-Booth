import type { Metadata } from 'next';
import ReelsApp from '@/components/reels/ReelsApp';

export const metadata: Metadata = {
  title: 'Impact Reel Challenge · Erode Marathon 2026',
  description: 'Register for the reels contest — Running for a Drug-Free Tamil Nadu.',
};

/** Public page opened from the reels QR code. */
export default function ReelsPage({ params }: { params: { expoId: string } }) {
  return <ReelsApp expoId={params.expoId} />;
}
