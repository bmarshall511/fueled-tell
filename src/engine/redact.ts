import { currentEntry, expectedGuessers, guessersForReveal } from './game';
import { revealMoments, type RoundMoment } from './moments';
import { computeStandings, summarizeReveal, type RevealSummary, type Standing } from './scoring';
import type { EntryId, GameState, Phase, PlayerId, Settings } from './types';

export interface PublicPlayer {
  id: PlayerId;
  name: string;
  colorIndex: number;
  connected: boolean;
  claimed: boolean;
}

/**
 * Everything one phone may see. Never contains other entries, and never
 * reveals who owns the current entry before the reveal (except to the owner,
 * as `item.mine`).
 */
export interface PlayerView {
  phase: Phase;
  settings: Pick<Settings, 'timerSec' | 'hostOnly' | 'intake' | 'maxLength' | 'topic' | 'customPrompt'>;
  me: PlayerId;
  players: PublicPlayer[];
  /** Lobby, live intake: whether my entry is in, and its text (mine only). */
  myEntry: string | null;
  submittedCount: number;
  index: number;
  total: number;
  item: { id: EntryId; text: string; mine: boolean } | null;
  myGuess: PlayerId | null;
  guessedCount: number;
  expectedCount: number;
  /** Remaining guess time when the snapshot was made; phones count down locally (no clock skew). */
  remainingMs: number | null;
  /** Ms since the reveal started on the host, for the shared drumroll. */
  revealElapsedMs: number | null;
  reveal: RevealSummary | null;
  /** At reveal: an easter-egg moment for the room (everyone right, nobody right, the herd). */
  moment: RoundMoment | null;
  /** At reveal: whether my correct guess was lightning fast. */
  lightning: boolean;
  standings: Standing[] | null;
}

export function redactFor(s: GameState, me: PlayerId, now: number, points?: { correct: number; fooled: number }): PlayerView {
  const entry = s.phase === 'lobby' || s.phase === 'finale' ? undefined : currentEntry(s);
  const revealed = s.phase === 'reveal';
  const mine = s.entries.find((e) => e.ownerId === me);
  const moments = revealMoments(s);
  return {
    phase: s.phase,
    settings: {
      timerSec: s.settings.timerSec,
      hostOnly: s.settings.hostOnly,
      intake: s.settings.intake,
      maxLength: s.settings.maxLength,
      topic: s.settings.topic,
      customPrompt: s.settings.customPrompt,
    },
    me,
    players: s.players.map(({ id, name, colorIndex, connected, claimed }) => ({ id, name, colorIndex, connected, claimed })),
    myEntry: s.phase === 'lobby' ? (mine?.text ?? null) : null,
    submittedCount: s.entries.length,
    index: s.index,
    total: s.order.length,
    item: entry ? { id: entry.id, text: entry.text, mine: entry.ownerId === me } : null,
    myGuess: s.guesses.find((g) => g.playerId === me)?.ownerId ?? null,
    guessedCount: s.guesses.length,
    expectedCount: entry ? expectedGuessers(s).length : 0,
    remainingMs: s.deadline === null ? null : Math.max(0, s.deadline - now),
    revealElapsedMs: s.revealedAt === null ? null : Math.max(0, now - s.revealedAt),
    reveal: revealed && entry ? summarizeReveal(entry, s.guesses, guessersForReveal(s)) : null,
    moment: moments?.moment ?? null,
    lightning: moments?.lightning.includes(me) ?? false,
    standings:
      s.phase === 'finale'
        ? computeStandings(
            s.entries.filter((e) => s.order.includes(e.id)),
            s.history,
            s.players.map((p) => p.id),
            points,
          )
        : null,
  };
}
