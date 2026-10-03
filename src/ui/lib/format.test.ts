import { describe, expect, it } from 'vitest';
import { listNames, ordinal, plural } from './format';

describe('format', () => {
  it('lists names with commas and a final ampersand', () => {
    expect(listNames([])).toBe('');
    expect(listNames(['Ada'])).toBe('Ada');
    expect(listNames(['Ada', 'Bo'])).toBe('Ada & Bo');
    expect(listNames(['Ada', 'Bo', 'Cy'])).toBe('Ada, Bo & Cy');
  });

  it('formats ordinals and plurals', () => {
    expect([1, 2, 3, 4, 11, 22].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '22nd']);
    expect(plural(1, ['guess in', 'guesses in'])).toBe('1 guess in');
    expect(plural(3, ['guess in', 'guesses in'])).toBe('3 guesses in');
  });
});
