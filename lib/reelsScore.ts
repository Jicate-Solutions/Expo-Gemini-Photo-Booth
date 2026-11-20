/**
 * Reels contest scoring (100 points), from the Erode Marathon plan §5.4:
 *   Reach 30 · Engagement 25 · Message quality 25 (jury) · Creativity 15 (jury) · Compliance 5 (checklist)
 *
 * Reach and engagement are scored RELATIVE to the other valid entries, and half of each comes
 * from performance against the creator's follower count — so small accounts are not at a disadvantage.
 *   Reach (30)       = 15 × reach / best reach            + 15 × (reach ÷ followers) / best ratio
 *   Engagement (25)  = 12.5 × engagements / best          + 12.5 × (engagements ÷ reach) / best rate
 *   engagements = likes + comments + shares + saves
 * PROVISIONAL — the plan says to publish the exact formula before the event; change it here only.
 */

export interface ScoreInput {
  id: string;
  status: string;
  followers: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  message_score: number | null;
  creativity_score: number | null;
  compliance_score: number | null;
}

export interface ScoreBreakdown {
  reach: number;
  engagement: number;
  message: number;
  creativity: number;
  compliance: number;
  total: number;
}

const n = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const round1 = (v: number) => Math.round(v * 10) / 10;

export const engagementsOf = (s: ScoreInput) => n(s.likes) + n(s.comments) + n(s.shares) + n(s.saves);

/** Scores every entry. Disqualified entries score 0 and are left out of the "best" comparisons. */
export function scoreSubmissions(subs: ScoreInput[]): Map<string, ScoreBreakdown> {
  const pool = subs.filter(s => s.status !== 'disqualified');
  const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);
  // Followers floor of 100 so a brand-new account with 3 followers can't top the ratio by luck
  const reachRatio = (s: ScoreInput) => ratio(n(s.reach), Math.max(n(s.followers), 100));
  const engRate = (s: ScoreInput) => ratio(engagementsOf(s), Math.max(n(s.reach), 1));

  const best = {
    reach: Math.max(0, ...pool.map(s => n(s.reach))),
    reachRatio: Math.max(0, ...pool.map(reachRatio)),
    eng: Math.max(0, ...pool.map(engagementsOf)),
    engRate: Math.max(0, ...pool.map(engRate)),
  };

  const out = new Map<string, ScoreBreakdown>();
  for (const s of subs) {
    if (s.status === 'disqualified') {
      out.set(s.id, { reach: 0, engagement: 0, message: 0, creativity: 0, compliance: 0, total: 0 });
      continue;
    }
    const reach = 15 * ratio(n(s.reach), best.reach) + 15 * ratio(reachRatio(s), best.reachRatio);
    const engagement = 12.5 * ratio(engagementsOf(s), best.eng) + 12.5 * ratio(engRate(s), best.engRate);
    const message = Math.min(25, n(s.message_score));
    const creativity = Math.min(15, n(s.creativity_score));
    const compliance = Math.min(5, n(s.compliance_score));
    out.set(s.id, {
      reach: round1(reach),
      engagement: round1(engagement),
      message,
      creativity,
      compliance,
      total: round1(reach + engagement + message + creativity + compliance),
    });
  }
  return out;
}

export const PRIZE_CATEGORIES = [
  { id: 'first', label: '🥇 1st prize' },
  { id: 'second', label: '🥈 2nd prize' },
  { id: 'third', label: '🥉 3rd prize' },
  { id: 'best_family', label: '👨‍👩‍👧 Best Family Reel' },
  { id: 'best_student', label: '🎓 Best Student Reel' },
  { id: 'most_impactful', label: '💡 Most Impactful Message' },
] as const;

export const SUBMISSION_STATUSES = ['pending', 'valid', 'disqualified'] as const;
