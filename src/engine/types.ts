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
  /** Points per correct guess, and per player an owner's entry fools. */
  points?: { correct: number; fooled: number };
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
  /** Finale headline. */
  finale: string;
  /** Lead-in before the winner's name. */
  winner: string;
  awards: {
    /** Most correct guesses. */
    detective: string;
    /** Owner of the entry the fewest people guessed. */
    mysterious: string;
    /** Owner who fooled the most guessers overall. */
    fooled: string;
  };
}

/** Phases of a single round. Phase 1 adds lobby / intro in front. */
export type RoundPhase = 'showing' | 'guessing' | 'locked' | 'reveal';

/** Session phase: a round phase, or the end-of-game finale. */
export type GamePhase = RoundPhase | 'finale';

export interface RoundState {
  phase: GamePhase;
  /** Shuffled entry order for the session. */
  order: EntryId[];
  index: number;
  /** Guesses for the current entry only. */
  guesses: Guess[];
  /** Epoch ms when guessing closes, while guessing. */
  deadline: number | null;
  /** Locked-in guesses of every finished entry, for final scoring. */
  history: Record<EntryId, Guess[]>;
}
