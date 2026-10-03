import { describe, expect, it } from 'vitest';
import { enigma, lightningIds, roundMoment } from './moments';
import type { RevealSummary, Standing } from './scoring';
import type { Guess } from './types';

const g = (playerId: string, ownerId: string, at?: number): Guess => ({
  playerId,
  entryId: 'e',
  ownerId,
  ...(at === undefined ? {} : { at }),
});
const sum = (correct: string[]): RevealSummary => ({ ownerId: 'o', correctPlayerIds: correct, ratioCorrect: 0 });
const st = (playerId: string, fooled: number): Standing => ({ playerId, fooled, score: 0, place: 1, correct: 0 });

describe('roundMoment', () => {
  it('calls a mind meld when everyone is right', () => {
    expect(roundMoment(sum(['a', 'b']), [g('a', 'o'), g('b', 'o')], 2, false)).toEqual({ kind: 'mindMeld' });
  });
  it('calls the herd when everyone picked the same wrong person', () => {
    expect(roundMoment(sum([]), [g('a', 'x'), g('b', 'x'), g('c', 'x')], 3, false)).toEqual({ kind: 'herd', suspectId: 'x' });
  });
  it('calls a disguise when nobody is right but picks differ (or in host-only mode)', () => {
    expect(roundMoment(sum([]), [g('a', 'x'), g('b', 'y')], 2, false)).toEqual({ kind: 'disguise' });
    expect(roundMoment(sum([]), [], 4, true)).toEqual({ kind: 'disguise' });
  });
  it('stays quiet for mixed results and tiny rounds', () => {
    expect(roundMoment(sum(['a']), [g('a', 'o'), g('b', 'x')], 2, false)).toBeNull();
    expect(roundMoment(sum(['a']), [g('a', 'o')], 1, false)).toBeNull();
  });
});

describe('lightningIds', () => {
  it('flags only correct guesses inside the window', () => {
    const guesses = [g('a', 'o', 1500), g('b', 'o', 5000), g('c', 'x', 1000)];
    expect(lightningIds(sum(['a', 'b']), guesses, 0)).toEqual(['a']);
    expect(lightningIds(sum(['a']), guesses, null)).toEqual([]);
  });
});

describe('enigma', () => {
  it('finds whoever fooled the most, sharing ties', () => {
    expect(enigma([st('a', 3), st('b', 5), st('c', 5)])).toEqual({ playerIds: ['b', 'c'], fooled: 5 });
    expect(enigma([st('a', 0)])).toBeNull();
  });
});
