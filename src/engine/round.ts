import type { Entry, EntryId, Guess, RoundState } from './types';

export type RoundAction =
  | { type: 'beginGuessing'; now: number; durationMs: number }
  | { type: 'guess'; guess: Guess }
  | { type: 'lock' }
  | { type: 'reveal' }
  | { type: 'next' };

export function createRound(order: EntryId[]): RoundState {
  return { phase: 'showing', order, index: 0, guesses: [], deadline: null, history: {} };
}

export const currentEntryId = (s: RoundState): EntryId | undefined => s.order[s.index];

export const isLastEntry = (s: RoundState): boolean => s.index >= s.order.length - 1;

/**
 * Pure round reducer: showing -> guessing -> locked -> reveal -> (next) showing,
 * and after the last entry's reveal, finale.
 * Invalid actions for the current phase return the same state object.
 */
export function roundReducer(entries: readonly Entry[]) {
  const byId = new Map(entries.map((e) => [e.id, e]));

  return (state: RoundState, action: RoundAction): RoundState => {
    switch (action.type) {
      case 'beginGuessing':
        if (state.phase !== 'showing') return state;
        return { ...state, phase: 'guessing', deadline: action.now + action.durationMs };

      case 'guess': {
        if (state.phase !== 'guessing') return state;
        const { guess } = action;
        const entry = byId.get(guess.entryId);
        if (!entry || guess.entryId !== currentEntryId(state)) return state;
        if (entry.ownerId === guess.playerId) return state; // can't guess your own entry
        // One guess per player: a new guess replaces the old one.
        const others = state.guesses.filter((g) => g.playerId !== guess.playerId);
        return { ...state, guesses: [...others, guess] };
      }

      case 'lock':
        if (state.phase !== 'guessing') return state;
        return { ...state, phase: 'locked', deadline: null };

      case 'reveal':
        if (state.phase !== 'locked') return state;
        return { ...state, phase: 'reveal' };

      case 'next': {
        if (state.phase !== 'reveal') return state;
        const id = currentEntryId(state);
        const history = id ? { ...state.history, [id]: state.guesses } : state.history;
        if (isLastEntry(state)) return { ...state, phase: 'finale', history, guesses: [], deadline: null };
        return { ...state, phase: 'showing', index: state.index + 1, guesses: [], deadline: null, history };
      }
    }
  };
}
