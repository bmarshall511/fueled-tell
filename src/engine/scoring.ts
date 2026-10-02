import type { Entry, EntryId, Guess, Pack, PlayerId } from './types';

export interface RevealSummary {
  ownerId: PlayerId;
  correctPlayerIds: PlayerId[];
  /** 0..1, of the players who guessed. */
  ratioCorrect: number;
}

export function summarizeReveal(entry: Entry, guesses: readonly Guess[]): RevealSummary {
  const forEntry = guesses.filter((g) => g.entryId === entry.id);
  const correctPlayerIds = forEntry.filter((g) => g.ownerId === entry.ownerId).map((g) => g.playerId);
  return {
    ownerId: entry.ownerId,
    correctPlayerIds,
    ratioCorrect: forEntry.length === 0 ? 0 : correctPlayerIds.length / forEntry.length,
  };
}

export const DEFAULT_POINTS = { correct: 100, fooled: 50 } as const;

export interface Standing {
  playerId: PlayerId;
  score: number;
  /** 1-based; equal scores share a place (1, 2, 2, 4). Order within a tie: more correct guesses first. */
  place: number;
  correct: number;
  fooled: number;
}

/**
 * Final standings. A correct guess scores `points.correct`; an owner scores
 * `points.fooled` for every player who guessed their entry wrong.
 */
export function computeStandings(
  entries: readonly Entry[],
  history: Readonly<Record<EntryId, readonly Guess[]>>,
  playerIds: readonly PlayerId[],
  points: NonNullable<Pack['points']> = DEFAULT_POINTS,
): Standing[] {
  const tally = new Map(playerIds.map((id) => [id, { correct: 0, fooled: 0 }]));
  for (const entry of entries) {
    for (const g of history[entry.id] ?? []) {
      if (g.ownerId === entry.ownerId) {
        const t = tally.get(g.playerId);
        if (t) t.correct += 1;
      } else {
        const t = tally.get(entry.ownerId);
        if (t) t.fooled += 1;
      }
    }
  }
  const rows = playerIds.map((playerId) => {
    const t = tally.get(playerId) ?? { correct: 0, fooled: 0 };
    return { playerId, ...t, score: t.correct * points.correct + t.fooled * points.fooled, place: 0 };
  });
  rows.sort((a, b) => b.score - a.score || b.correct - a.correct);
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.place = prev && prev.score === r.score ? prev.place : i + 1;
  });
  return rows;
}

export interface Awards {
  detective: PlayerId | null;
  mysterious: PlayerId | null;
  fooled: PlayerId | null;
}

/** Fun awards for the finale. Each goes to one player (first by standings on ties). */
export function computeAwards(
  entries: readonly Entry[],
  history: Readonly<Record<EntryId, readonly Guess[]>>,
  standings: readonly Standing[],
): Awards {
  const top = (key: 'correct' | 'fooled') =>
    standings.reduce<Standing | null>((best, s) => (s[key] > 0 && (!best || s[key] > best[key]) ? s : best), null)
      ?.playerId ?? null;
  let mysterious: { ownerId: PlayerId; correct: number } | null = null;
  for (const e of entries) {
    const guesses = history[e.id];
    if (!guesses?.length) continue;
    const correct = guesses.filter((g) => g.ownerId === e.ownerId).length;
    if (!mysterious || correct < mysterious.correct) mysterious = { ownerId: e.ownerId, correct };
  }
  return { detective: top('correct'), mysterious: mysterious?.ownerId ?? null, fooled: top('fooled') };
}
