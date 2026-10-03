/** Room codes: 4 characters with no ambiguous letters or digits (no O/0, I/1/L, S/5, Z/2, B/8). */
export const ROOM_ALPHABET = 'ACDEFGHJKMNPQRTUVWXY34679';
export const ROOM_CODE_LENGTH = 4;

/** Words the alphabet can spell that must never be a room code. */
export const BLOCKED_CODES: ReadonlySet<string> = new Set([
  'FUCK',
  'CUNT',
  'TWAT',
  'WANK',
  'PRAT',
  'DAMN',
  'DUMP',
  'HATE',
  'KKKK',
  'DEAD',
  'DEAF',
]);

/** Rare, harmless words the alphabet can spell: the lobby celebrates them as a "lucky code". */
export const LUCKY_CODES: ReadonlySet<string> = new Set([
  'CAFE',
  'FACE',
  'FAME',
  'GAME',
  'MEGA',
  'HERD',
  'HAND',
  'CARD',
  'DECK',
  'TEAM',
  'MEET',
  'CHAT',
  'HACK',
  'TEXT',
  'YEAH',
  'GEAR',
  'NEAT',
  'PACK',
  'PERK',
  'QUAD',
  'CUTE',
  'JUMP',
  'MEME',
  'HYPE',
  'WAVE',
  'WAKE',
  'MAKE',
  'CAKE',
  'DATE',
  'MATE',
  'FEED',
  'KEEN',
  'JACK',
  'MYTH',
  'TECH',
]);

export const isLuckyCode = (code: string): boolean => LUCKY_CODES.has(code);

export function makeRoomCode(rand: () => number = Math.random): string {
  const pick = () => Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_ALPHABET[Math.floor(rand() * ROOM_ALPHABET.length)]).join('');
  let code = pick();
  while (BLOCKED_CODES.has(code)) code = pick();
  return code;
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
