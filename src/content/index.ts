import { asContent } from '../engine/content';
import type { GameContent } from '../engine/types';
import game from './game.json';

/** The game's content: prompt, limits, timer default, points, and every game-specific line of copy. */
export const GAME: GameContent = asContent(game);
