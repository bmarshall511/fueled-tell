import { describe, expect, it } from 'vitest';
import type { PlayerView } from '../engine/redact';
import { kindOf, screenFor } from './screenFor';

const view = (patch: Partial<PlayerView>): PlayerView =>
  ({ phase: 'guessing', item: { id: 'e1', text: 't', mine: false }, myGuess: null, ...patch }) as PlayerView;
const base = { room: 'K7QF', status: 'open' as const, joined: true, changing: false };

describe('screenFor', () => {
  it('walks connection states before a view arrives', () => {
    expect(screenFor({ ...base, room: null, view: null }).kind).toBe('code');
    expect(screenFor({ ...base, status: 'connecting', view: null }).kind).toBe('connecting');
    expect(screenFor({ ...base, status: 'not-found', view: null }).kind).toBe('notFound');
    expect(screenFor({ ...base, joined: false, view: view({}) }).kind).toBe('join');
  });

  it('says the game ended, and keeps the game on screen while the host is briefly gone', () => {
    expect(screenFor({ ...base, room: null, view: null, ended: true }).kind).toBe('ended');
    expect(screenFor({ ...base, status: 'not-found', view: view({}) }).kind).toBe('pick');
  });

  it('picks the round screen', () => {
    expect(screenFor({ ...base, view: view({ phase: 'lobby', item: null }) }).kind).toBe('lobby');
    expect(screenFor({ ...base, view: view({ phase: 'showing' }) }).kind).toBe('pick');
    expect(screenFor({ ...base, view: view({}) }).kind).toBe('pick');
    expect(screenFor({ ...base, view: view({ myGuess: 'p2' }) }).kind).toBe('waiting');
    expect(screenFor({ ...base, changing: true, view: view({ myGuess: 'p2' }) }).kind).toBe('pick');
    expect(screenFor({ ...base, view: view({ phase: 'locked' }) }).kind).toBe('waiting');
    expect(screenFor({ ...base, view: view({ item: { id: 'e1', text: 't', mine: true } }) }).kind).toBe('yours');
    expect(screenFor({ ...base, view: view({ phase: 'reveal' }) }).kind).toBe('result');
    expect(screenFor({ ...base, view: view({ phase: 'finale', item: null }) }).kind).toBe('final');
  });

  it('changes key per entry so each round transitions', () => {
    expect(screenFor({ ...base, view: view({}) }).key).not.toBe(
      screenFor({ ...base, view: view({ item: { id: 'e2', text: '', mine: false } }) }).key,
    );
  });

  it('round-trips the kind through the key', () => {
    expect(kindOf('notFound')).toBe('notFound');
    expect(kindOf('result:e_1')).toBe('result');
  });
});
