/** Game rule constants (behavior, not design). */
export const RULES = {
  /** Minimum entries to start a game. */
  minEntries: 3,
  /** Longest player name, in characters. */
  maxNameLength: 32,
  /** How long the "showing" entrance lasts before guessing opens. */
  showingMs: 3500,
  /** Grace after the last guess before auto-lock. */
  autoLockDelayMs: 900,
  /** Drumroll before the reveal flip, shared by host and phones. */
  drumrollMs: 2100,
  /** Round moments (everyone right, nobody right, the herd) need at least this many guessers. */
  momentMinGuessers: 2,
  /** "The herd": everyone picked the same wrong person, with at least this many guessers. */
  herdMinGuessers: 3,
  /** A correct guess locked in this soon after guessing opens is "lightning fast". */
  lightningMs: 2000,
} as const;
