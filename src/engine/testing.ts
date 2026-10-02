import { createGame, gameReducer, type GameAction } from './game';
import type { GameState, Pack } from './types';

/** Test helpers (imported by *.test.ts only). */
export const TEST_PACK: Pack = {
  id: 'test',
  name: 'Test',
  prompt: 'p',
  entry: { type: 'text', maxLength: 50 },
  guess: 'owner',
  timerSec: 30,
  scoring: 'competitive',
  points: { correct: 100, fooled: 50 },
  copy: {
    item: 'Item',
    question: 'q',
    reveal: 'r',
    yours: 'y',
    waiting: 'w',
    finale: 'f',
    winner: 'win',
    awards: { detective: 'd', mysterious: 'm', fooled: 'f' },
  },
};

export const run = (s: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, s);

/** A lobby with 4 joined phones (a, b, c, d) and one entry each. */
export function lobbyWithFour(): GameState {
  let s = createGame(TEST_PACK, { intake: 'live' });
  for (const id of ['a', 'b', 'c', 'd']) {
    s = run(s, { type: 'join', playerId: id, name: id.toUpperCase() }, { type: 'submit', playerId: id, text: `entry by ${id}` });
  }
  return s;
}
