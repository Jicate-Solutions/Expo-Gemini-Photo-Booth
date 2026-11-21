/**
 * Server-only: contest results (plan §7 screen 10 "Leaderboard, certificate download",
 * §5.6 "Certificates for all valid entries").
 * Only reels the jury marked VALID appear in public results; best reel per person counts.
 */
import { createClient } from '@/lib/supabase/server';
import { PRIZE_CATEGORIES, scoreSubmissions, type ScoreInput } from '@/lib/reelsScore';

interface ParticipantRow { id: string; code: string; full_name: string; mobile: string }
type SubmissionRow = ScoreInput & { participant_id: string; prize_category: string | null };

export interface PublicEntry {
  rank: number;
  name: string; // "Priya R." — first name + initial only, for the public list
  code: string;
  score: number;
  prize: string | null; // prize id
}

export interface ContestResults {
  leaderboard: PublicEntry[]; // top 10
  winners: { prize: string; title: string; name: string; code: string }[];
  byParticipant: Map<string, { rank: number; score: number; prize: string | null }>;
  participants: ParticipantRow[];
}

/** "priya ramasamy" → "Priya R." */
export function publicName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return cap(parts[0]);
  return `${cap(parts[0])} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

async function fetchAll<T>(table: string, columns: string, expoId: string): Promise<T[]> {
  const supabase = createClient();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).eq('expo_id', expoId).range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return rows;
  }
}

export async function computeResults(expoId: string): Promise<ContestResults> {
  const [participants, submissions] = await Promise.all([
    fetchAll<ParticipantRow>('reel_participants', 'id, code, full_name, mobile', expoId),
    fetchAll<SubmissionRow>(
      'reel_submissions',
      'id, participant_id, status, followers, reach, likes, comments, shares, saves, message_score, creativity_score, compliance_score, prize_category',
      expoId,
    ),
  ]);

  // Same scoring as the admin leaderboard, then keep only VALID reels for the public
  const scores = scoreSubmissions(submissions);
  const best = new Map<string, { score: number; prize: string | null }>();
  for (const s of submissions) {
    if (s.status !== 'valid') continue;
    const score = scores.get(s.id)?.total ?? 0;
    const cur = best.get(s.participant_id);
    const prize = s.prize_category ?? cur?.prize ?? null;
    if (!cur || score > cur.score) best.set(s.participant_id, { score, prize });
    else if (s.prize_category && !cur.prize) cur.prize = s.prize_category;
  }

  const byId = new Map(participants.map(p => [p.id, p]));
  const ranked = Array.from(best.entries())
    .filter(([pid]) => byId.has(pid))
    .sort((a, b) => b[1].score - a[1].score);

  const byParticipant = new Map<string, { rank: number; score: number; prize: string | null }>();
  ranked.forEach(([pid, v], i) => byParticipant.set(pid, { rank: i + 1, score: v.score, prize: v.prize }));

  const leaderboard: PublicEntry[] = ranked.slice(0, 10).map(([pid, v], i) => {
    const p = byId.get(pid)!;
    return { rank: i + 1, name: publicName(p.full_name), code: p.code, score: v.score, prize: v.prize };
  });

  const winners = PRIZE_CATEGORIES.flatMap(cat =>
    ranked
      .filter(([, v]) => v.prize === cat.id)
      .map(([pid]) => ({ prize: cat.id, title: cat.title, name: publicName(byId.get(pid)!.full_name), code: byId.get(pid)!.code })),
  );

  return { leaderboard, winners, byParticipant, participants };
}
