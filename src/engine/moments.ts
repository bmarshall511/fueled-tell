import { currentEntry, guessersForReveal } from './game';
import { RULES } from './rules';
import { summarizeReveal, type RevealSummary, type Standing } from './scoring';
import type { GameState, Guess, PlayerId } from './types';

/**
 * Easter-egg moments, worked out from results the engine already has. Pure, and only ever
 * evaluated at reveal or finale, so none of them can hint at whose entry is whose.
 */
export type RoundMoment =
  /** Everyone who guessed got it right. */
  | { kind: 'mindMeld' }
  /** Nobody got it: the owner fooled the room. */
  | { kind: 'disguise' }
  /** Nobody got it, and everyone picked the same wrong person. */
  | { kind: 'herd'; suspectId: PlayerId };

/** `guessers`: how many took part (host-only mode passes everyone but the owner; there are no wrong guesses to compare). */
export function roundMoment(summary: RevealSummary, guesses: readonly Guess[], guessers: number, hostOnly: boolean): RoundMoment | null {
  if (guessers < RULES.momentMinGuessers) return null;
  const right = summary.correctPlayerIds.length;
  if (right === guessers) return { kind: 'mindMeld' };
  if (right > 0) return null;
  const picks = new Set(guesses.map((g) => g.ownerId));
  const [suspectId] = picks;
  if (!hostOnly && guesses.length >= RULES.herdMinGuessers && picks.size === 1 && suspectId) return { kind: 'herd', suspectId };
  return { kind: 'disguise' };
}

/** Correct guesses that arrived within `RULES.lightningMs` of guessing opening. */
export function lightningIds(summary: RevealSummary, guesses: readonly Guess[], openedAt: number | null): PlayerId[] {
  if (openedAt === null) return [];
  return guesses
    .filter((g) => summary.correctPlayerIds.includes(g.playerId) && g.at !== undefined && g.at - openedAt <= RULES.lightningMs)
    .map((g) => g.playerId);
}

/** "The Enigma": whoever fooled the most people across the game (ties share it). Nobody, if nobody fooled anyone. */
export function enigma(standings: readonly Standing[]): { playerIds: PlayerId[]; fooled: number } | null {
  const most = Math.max(0, ...standings.map((s) => s.fooled));
  if (most === 0) return null;
  return { playerIds: standings.filter((s) => s.fooled === most).map((s) => s.playerId), fooled: most };
}

/** The current reveal's moment and lightning-fast guessers, straight from game state (null outside a reveal). */
export function revealMoments(s: GameState): { moment: RoundMoment | null; lightning: PlayerId[] } | null {
  const entry = currentEntry(s);
  if (s.phase !== 'reveal' || !entry) return null;
  const guesses = s.guesses.filter((g) => g.entryId === entry.id);
  const summary = summarizeReveal(entry, guesses, guessersForReveal(s));
  return {
    moment: roundMoment(summary, guesses, guessersForReveal(s), s.settings.hostOnly),
    lightning: lightningIds(summary, guesses, s.openedAt ?? null),
  };
}
