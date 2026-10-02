import type { PlayerView } from '../../engine/redact';
import type { PlayerGame } from '../usePlayerGame';

/** What every in-room screen gets. Game copy comes from `GAME` (src/content). */
export interface ScreenProps {
  view: PlayerView;
  game: PlayerGame;
}
