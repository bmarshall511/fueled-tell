import { describe, expect, it } from 'vitest';
import { computeStandings } from './scoring';
import type { Entry, Guess } from './types';

const entries: Entry[] = [
  { id: 'e1', ownerId: 'a', text: '' },
  { id: 'e2', ownerId: 'b', text: '' },
];
const g = (playerId: string, entryId: string, ownerId: string): Guess => ({ playerId, entryId, ownerId });

describe('computeStandings', () => {
  it('scores correct guesses and fooled players, and shares places on ties', () => {
    const history = {
      e1: [g('b', 'e1', 'a'), g('c', 'e1', 'b')], // b right; c fooled by a
      e2: [g('a', 'e2', 'b'), g('c', 'e2', 'a')], // a right; c fooled by b
    };
    const s = computeStandings(entries, history, ['a', 'b', 'c'], { correct: 100, fooled: 50 });
    expect(s.map((r) => [r.playerId, r.score, r.place])).toEqual([
      ['a', 150, 1],
      ['b', 150, 1],
      ['c', 0, 3],
    ]);
  });
});
