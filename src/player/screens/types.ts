import type { PlayerView } from '../../engine/redact';
import type { Pack } from '../../engine/types';
import type { PlayerGame } from '../usePlayerGame';

/** What every in-room screen gets. */
export interface ScreenProps {
  view: PlayerView;
  game: PlayerGame;
  pack: Pack;
}
