/** Room codes: 4 characters with no ambiguous letters or digits (no O/0, I/1/L, S/5, Z/2, B/8). */
export const ROOM_ALPHABET = 'ACDEFGHJKMNPQRTUVWXY34679';
export const ROOM_CODE_LENGTH = 4;

export function makeRoomCode(rand: () => number = Math.random): string {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_ALPHABET[Math.floor(rand() * ROOM_ALPHABET.length)]).join('');
}

/** Uppercases and drops anything outside the alphabet, so "k7qf " -> "K7QF". */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .filter((c) => ROOM_ALPHABET.includes(c))
    .join('')
    .slice(0, ROOM_CODE_LENGTH);
}

export const isRoomCode = (code: string): boolean => normalizeRoomCode(code) === code && code.length === ROOM_CODE_LENGTH;
