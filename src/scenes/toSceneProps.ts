import type { Entry, PackCopy, RoundPhase, RoundState } from '../engine/types';
import { summarizeReveal } from '../engine/scoring';
import type { SeatedPlayer } from '../ui/types';
import type { SceneProps } from './Scene';

/** Redacted snapshot for the host screen: guess targets and owner only appear at reveal. */
export function toSceneProps(
  state: RoundState,
  entry: Entry,
  players: readonly SeatedPlayer[],
  copy: PackCopy,
  reducedMotion: boolean,
): SceneProps {
  // The finale is a host screen, not a scene phase: scenes hold their last reveal under it.
  const phase: RoundPhase = state.phase === 'finale' ? 'reveal' : state.phase;
  const revealed = phase === 'reveal';
  return {
    phase,
    item: { id: entry.id, text: entry.text, index: state.index, total: state.order.length },
    players,
    guesses: state.guesses.map((g) => (revealed ? { playerId: g.playerId, ownerId: g.ownerId } : { playerId: g.playerId })),
    reveal: revealed ? summarizeReveal(entry, state.guesses) : null,
    copy,
    reducedMotion,
  };
}
