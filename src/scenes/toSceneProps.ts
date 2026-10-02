import { currentEntry, guessersForReveal } from '../engine/game';
import { summarizeReveal } from '../engine/scoring';
import type { GameState, PackCopy, RoundPhase } from '../engine/types';
import type { SceneProps } from './Scene';

/**
 * Redacted snapshot for the host screen: guess targets and the owner only appear
 * at reveal. `holdReveal` keeps the scene in "locked" during the drumroll.
 */
export function toSceneProps(s: GameState, copy: PackCopy, reducedMotion: boolean, holdReveal: boolean): SceneProps | null {
  const entry = currentEntry(s);
  if (!entry || s.phase === 'lobby' || s.phase === 'finale') return null;
  const phase: RoundPhase = s.phase === 'reveal' && holdReveal ? 'locked' : s.phase;
  const revealed = phase === 'reveal';
  return {
    phase,
    item: { id: entry.id, text: entry.text, index: s.index, total: s.order.length },
    players: s.players,
    guesses: s.guesses.map((g) => (revealed ? { playerId: g.playerId, ownerId: g.ownerId } : { playerId: g.playerId })),
    reveal: revealed ? summarizeReveal(entry, s.guesses, guessersForReveal(s)) : null,
    copy,
    reducedMotion,
  };
}
