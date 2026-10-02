import { describe, it, expect } from 'vitest';
import { encodeQr } from './encode';

/** Checks the 7x7 finder pattern (dark ring, light ring, dark 3x3 core) at (left, top). */
function hasFinder(m: boolean[][], left: number, top: number): boolean {
  for (let dy = 0; dy < 7; dy++) {
    for (let dx = 0; dx < 7; dx++) {
      const dist = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      if (m[top + dy]?.[left + dx] !== (dist !== 2)) return false;
    }
  }
  return true;
}

describe('encodeQr', () => {
  it('encodes a short string as version 1 (21x21) at ECC M', () => {
    const m = encodeQr('HELLO');
    expect(m).toHaveLength(21);
    m.forEach((row) => expect(row).toHaveLength(21));
  });

  it('places finder patterns in the three corners', () => {
    const m = encodeQr('https://tell.example/play?room=K7QF');
    const n = m.length;
    expect(hasFinder(m, 0, 0)).toBe(true);
    expect(hasFinder(m, n - 7, 0)).toBe(true);
    expect(hasFinder(m, 0, n - 7)).toBe(true);
    expect(hasFinder(m, n - 7, n - 7)).toBe(false);
  });

  it('picks the smallest fitting version for a ~100-char URL', () => {
    const url = `https://tell.example/play?room=K7QF&name=${'x'.repeat(59)}`;
    expect(url).toHaveLength(100);
    // 100 bytes at ECC M: v5 holds 84, v6 holds 106 -> version 6 = 17 + 4*6 = 41.
    expect(encodeQr(url, 'M')).toHaveLength(17 + 4 * 6);
    // At ECC L: v4 holds 78, v5 holds 106 -> version 5.
    expect(encodeQr(url, 'L')).toHaveLength(17 + 4 * 5);
  });

  it('throws when the text does not fit in version 15', () => {
    expect(() => encodeQr('x'.repeat(600), 'M')).toThrow(/too long/);
    expect(() => encodeQr('x'.repeat(300), 'H')).toThrow(/too long/);
  });
});
