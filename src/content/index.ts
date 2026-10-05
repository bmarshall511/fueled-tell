import { asContent, copyFor, promptFor } from '../engine/content';
import type { GameContent, GameCopy, Settings } from '../engine/types';
import game from './game.json';

/** The game's content: topics, limits, timer default, points, and every game-specific line of copy. */
export const GAME: GameContent = asContent(game);

/** This game's copy with its topic's words ("Story", "Whose story is it?") filled in. */
export const gameCopy = (settings: Pick<Settings, 'topic'>): GameCopy => copyFor(GAME, settings);

/** What players are asked to write in this game. */
export const gamePrompt = (settings: Pick<Settings, 'topic' | 'customPrompt'>): string => promptFor(GAME, settings);
