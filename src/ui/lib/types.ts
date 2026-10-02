import type { Player } from '../../engine/types';

/** A player as the UI needs it: a name and a stable seat for their color token. */
export type SeatedPlayer = Pick<Player, 'id' | 'name' | 'colorIndex'>;
