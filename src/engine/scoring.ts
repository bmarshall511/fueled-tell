import type { Entry, Guess, PlayerId } from './types';

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
