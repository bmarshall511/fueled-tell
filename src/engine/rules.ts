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
} as const;
