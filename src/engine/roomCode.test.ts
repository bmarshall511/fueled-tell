import { describe, expect, it } from 'vitest';
import { isRoomCode, makeRoomCode, normalizeRoomCode, ROOM_ALPHABET } from './roomCode';

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
