/** Core game types. Pure data: no React, no DOM, no transport. */

export type PlayerId = string;
export type EntryId = string;

export interface Player {
  id: PlayerId;
  name: string;
  /** Stable seat, used to pick the player's color token. */
  colorIndex: number;
  /** A phone is currently attached to this player. */
  connected: boolean;
  /** A phone has ever joined as this player (false for host-imported names nobody has claimed yet). */
  claimed: boolean;
  /**
   * Secret the claiming phone holds (generated on the phone, never sent to other phones).
   * A re-join must present it, so nobody can take over someone else's seat.
   */
  key?: string;
}

/** One submission (a story, a fave show, ...). */
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

/** Everything game-specific lives in src/content/game.json, not in code. */
export interface GameContent {
  /** What players are asked to write. */
  prompt: string;
  entry: { maxLength: number };
  timerSec: number;
  /** Points per correct guess, and per player an owner's entry fools. */
  points?: { correct: number; fooled: number };
  copy: GameCopy;
}

export interface GameCopy {
  /** Short noun for one entry, e.g. "Story". */
  item: string;
  /** Headline while guessing. */
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
}

export type Intake = 'host' | 'live';

export interface Settings {
  timerSec: number;
  /** No phones: players shout guesses and the host tallies who got it. */
  hostOnly: boolean;
  /** Host imports entries, or players submit them from the lobby. */
  intake: Intake;
  /** Longest entry allowed (from the game content). */
  maxLength: number;
}

export type Phase = 'lobby' | 'showing' | 'guessing' | 'locked' | 'reveal' | 'finale';

/** Phases of a single round (what the 3D scenes render). */
export type RoundPhase = Extract<Phase, 'showing' | 'guessing' | 'locked' | 'reveal'>;

export interface GameState {
  phase: Phase;
  settings: Settings;
  players: Player[];
  entries: Entry[];
  /** Shuffled entry order, fixed at start. */
  order: EntryId[];
  index: number;
  /** Guesses for the current entry. */
  guesses: Guess[];
  /** Locked-in guesses of every finished entry, for final scoring. */
  history: Record<EntryId, Guess[]>;
  /** Epoch ms (host clock) when guessing closes. */
  deadline: number | null;
  /** Epoch ms (host clock) when the current reveal started (drumroll sync). */
  revealedAt: number | null;
}
