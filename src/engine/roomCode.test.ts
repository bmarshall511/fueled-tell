import { describe, expect, it } from 'vitest';
import { BLOCKED_CODES, isRoomCode, LUCKY_CODES, makeRoomCode, normalizeRoomCode, ROOM_ALPHABET } from './roomCode';

describe('room codes', () => {
  it('makes 4-char codes from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const c = makeRoomCode();
      expect(c).toHaveLength(4);
      expect([...c].every((ch) => ROOM_ALPHABET.includes(ch))).toBe(true);
    }
    expect(ROOM_ALPHABET).not.toMatch(/[O0I1LS5Z2B8]/);
  });

  it('normalizes user input', () => {
    expect(normalizeRoomCode(' k7qf ')).toBe('K7QF');
    expect(isRoomCode('K7QF')).toBe(true);
    expect(isRoomCode('K7Q')).toBe(false);
  });
});

describe('lucky and blocked codes', () => {
  it('only lists words the alphabet can actually spell', () => {
    for (const w of [...LUCKY_CODES, ...BLOCKED_CODES]) expect(isRoomCode(w), w).toBe(true);
  });
  it('never generates a blocked word', () => {
    const word = [...BLOCKED_CODES][0] as string;
    let i = 0;
    // A rand that spells the blocked word first, then something else.
    const seq = [...word.split('').map((c) => ROOM_ALPHABET.indexOf(c)), 0, 0, 0, 0].map((n) => (n + 0.5) / ROOM_ALPHABET.length);
    expect(makeRoomCode(() => seq[i++] ?? 0)).toBe('AAAA');
  });
});
