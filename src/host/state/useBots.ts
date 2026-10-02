import { useEffect } from 'react';
import type { GameAction } from '../../engine/game';
import { seeded } from '../../engine/random';
import type { GameState, Player } from '../../engine/types';

/** Dev/demo only (`?bots=1`). Bots are the host-imported players (ids start with `p_`). */
const enabled = () => new URLSearchParams(window.location.search).has('bots');
const isBot = (p: Player) => p.id.startsWith('p_');

/**
 * Bots (re)connect whenever they aren't (e.g. after a reload) and guess, about
 * half right, during guessing. Effects key on phase/index on purpose: re-running
 * on every state change would reschedule the guesses.
 */
export function useBots(state: GameState | null, dispatch: (a: GameAction) => void): void {
  const on = enabled();
  const idle = state?.players.filter((p) => isBot(p) && !p.connected).length ?? 0;
  useEffect(() => {
    if (!on || !state || !idle) return;
    for (const p of state.players.filter((x) => isBot(x) && !x.connected)) dispatch({ type: 'join', playerId: p.id, name: p.name });
  }, [on, idle]);

  const phase = state?.phase;
  const index = state?.index;
  useEffect(() => {
    if (!on || !state || phase !== 'guessing') return;
    const entry = state.entries.find((e) => e.id === state.order[state.index]);
    if (!entry) return;
    const rand = seeded(state.index * 7919 + 13);
    const timers = state.players
      .filter((p) => isBot(p) && p.id !== entry.ownerId)
      .map((p) => {
        const others = state.players.filter((o) => o.id !== p.id && o.id !== entry.ownerId);
        const ownerId = rand() < 0.5 ? entry.ownerId : (others[Math.floor(rand() * others.length)]?.id ?? entry.ownerId);
        const at = (0.1 + rand() * 0.45) * state.settings.timerSec * 1000;
        return window.setTimeout(() => dispatch({ type: 'guess', playerId: p.id, entryId: entry.id, ownerId }), at);
      });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [on, phase, index]);
}
