import { useEffect } from 'react';
import { expectedGuessers, type GameAction } from '../../engine/game';
import { RULES } from '../../engine/rules';
import type { GameState } from '../../engine/types';

/** The round's clock: open guessing after the entrance, lock at the deadline, or early once everyone's in. */
export function useRoundTimers(state: GameState | null, dispatch: (a: GameAction) => void): void {
  const phase = state?.phase;
  const index = state?.index;
  const deadline = state?.deadline ?? null;

  useEffect(() => {
    if (phase !== 'showing') return;
    const id = window.setTimeout(() => dispatch({ type: 'beginGuessing', now: Date.now() }), RULES.showingMs);
    return () => window.clearTimeout(id);
  }, [phase, index, dispatch]);

  useEffect(() => {
    if (phase !== 'guessing' || deadline === null) return;
    const id = window.setTimeout(() => dispatch({ type: 'lock' }), Math.max(0, deadline - Date.now()));
    return () => window.clearTimeout(id);
  }, [phase, deadline, dispatch]);

  const expected = state && phase === 'guessing' ? expectedGuessers(state).length : 0;
  const allIn = !state?.settings.hostOnly && phase === 'guessing' && expected > 0 && (state?.guesses.length ?? 0) >= expected;
  useEffect(() => {
    if (!allIn) return;
    const id = window.setTimeout(() => dispatch({ type: 'lock' }), RULES.autoLockDelayMs);
    return () => window.clearTimeout(id);
  }, [allIn, dispatch]);
}
