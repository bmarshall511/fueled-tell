/** Core game types. Pure data: no React, no DOM, no transport. */

export type PlayerId = string;
export type EntryId = string;

export interface Player {
  id: PlayerId;
  name: string;
}

/** One submission in a pack (a story, a fave show, ...). */
export interface Entry {
  id: EntryId;
  ownerId: PlayerId;
  text: string;
}

export interface Guess {
  playerId: PlayerId;
  entryId: EntryId;
  ownerId: PlayerId;
}

export type ScoringMode = 'light' | 'competitive' | 'none';

/** Everything game-specific lives in a pack JSON, not in code. */
export interface Pack {
  id: string;
  name: string;
  prompt: string;
  entry: { type: 'text'; maxLength: number };
  guess: 'owner';
  timerSec: number;
  scoring: ScoringMode;
  copy: PackCopy;
}

export interface PackCopy {
  /** Short noun for one entry, e.g. "Story". */
  item: string;
  /** Host headline while guessing. */
  question: string;
  /** Lead-in before the owner's name on reveal. */
  reveal: string;
  /** Phone: shown to the owner of the current entry. */
  yours: string;
  /** Phone: after a guess is locked in. */
  waiting: string;
}

/** Phases of a single round. Phase 1 wraps these in lobby / intro / finale. */
export type RoundPhase = 'showing' | 'guessing' | 'locked' | 'reveal';

export interface RoundState {
  phase: RoundPhase;
  /** Shuffled entry order for the session. */
  order: EntryId[];
  index: number;
  /** Guesses for the current entry only. */
  guesses: Guess[];
  /** Epoch ms when guessing closes, while guessing. */
  deadline: number | null;
}
