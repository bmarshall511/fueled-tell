import type { Player } from '../engine/types';

/** A player with a stable seat, used to pick their color token. */
export interface SeatedPlayer extends Player {
  colorIndex: number;
}
