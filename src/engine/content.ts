import type { GameContent } from './types';

/** Minimal runtime check for the game content JSON (src/content/game.json). */
export function asContent(raw: unknown): GameContent {
  const c = raw as Partial<GameContent>;
  if (!c || typeof c.prompt !== 'string' || !c.copy || !c.entry || typeof c.timerSec !== 'number') {
    throw new Error('Invalid game content JSON');
  }
  return c as GameContent;
}
