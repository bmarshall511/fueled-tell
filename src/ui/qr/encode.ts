/**
 * Dependency-free QR code encoder (ISO/IEC 18004), byte mode only, versions 1–15.
 * Follows the structure of Project Nayuki's reference implementation.
 * Returns the module matrix as rows (`matrix[y][x]`, true = dark), without quiet zone.
 */

export type QrEcc = 'L' | 'M' | 'Q' | 'H';

const MAX_VERSION = 15;

/** Format-info bits for each ECC level (note: not in L,M,Q,H order). */
const ECC_FORMAT_BITS: Record<QrEcc, number> = { L: 1, M: 0, Q: 3, H: 2 };

/** ECC codewords per block, indexed by version (index 0 unused). */
const ECC_PER_BLOCK: Record<QrEcc, readonly number[]> = {
  L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22],
  M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24],
  Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30],
  H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24],
};

/** Number of ECC blocks, indexed by version (index 0 unused). */
const NUM_BLOCKS: Record<QrEcc, readonly number[]> = {
  L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6],
  M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10],
  Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12],
  H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18],
};

const at = (table: readonly number[], i: number): number => {
  const v = table[i];
  if (v === undefined) throw new Error(`QR table lookup out of range: ${i}`);
  return v;
};

const bit = (value: number, i: number): boolean => ((value >>> i) & 1) !== 0;

/** Modules available for data + ECC after all function patterns are placed. */
function rawDataModules(ver: number): number {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    n -= (25 * align - 10) * align - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}

function dataCodewords(ver: number, ecc: QrEcc): number {
  return Math.floor(rawDataModules(ver) / 8) - at(ECC_PER_BLOCK[ecc], ver) * at(NUM_BLOCKS[ecc], ver);
}

/** Centre coordinates of alignment patterns (both axes use the same list). */
function alignmentPositions(ver: number): number[] {
  if (ver === 1) return [];
  const count = Math.floor(ver / 7) + 2;
  const step = Math.ceil((ver * 4 + 4) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let pos = ver * 4 + 17 - 7; result.length < count; pos -= step) result.splice(1, 0, pos);
  return result;
}

// ---- Reed–Solomon over GF(2^8), primitive polynomial 0x11D ----

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

/** Generator polynomial coefficients (highest term dropped) for the given degree. */
function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(at(result, j), root);
      if (j + 1 < degree) result[j] = at(result, j) ^ at(result, j + 1);
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] = at(result, i) ^ gfMul(coef, factor);
    });
  }
  return result;
}

/** Split data into blocks, append ECC to each, and interleave. */
function addEccAndInterleave(data: readonly number[], ver: number, ecc: QrEcc): number[] {
  const numBlocks = at(NUM_BLOCKS[ecc], ver);
  const eccLen = at(ECC_PER_BLOCK[ecc], ver);
  const rawCodewords = Math.floor(rawDataModules(ver) / 8);
  const numShort = numBlocks - (rawCodewords % numBlocks);
  const shortLen = Math.floor(rawCodewords / numBlocks);
  const divisor = rsDivisor(eccLen);

  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const len = shortLen - eccLen + (i < numShort ? 0 : 1);
    const dat = data.slice(k, k + len);
    k += len;
    const eccBytes = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0); // placeholder so all blocks share a length; skipped below
    blocks.push(dat.concat(eccBytes));
  }

  const result: number[] = [];
  for (let i = 0; i < shortLen + 1; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShort) result.push(at(block, i));
    });
  }
  return result;
}

// ---- Data encoding ----

function encodeData(bytes: Uint8Array, ver: number, ecc: QrEcc): number[] {
  const bits: boolean[] = [];
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push(bit(value, i));
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, ver <= 9 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));

  const capacity = dataCodewords(ver, ecc) * 8;
  push(0, Math.min(4, capacity - bits.length)); // terminator
  push(0, (8 - (bits.length % 8)) % 8); // byte align
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ? 1 : 0);
    codewords.push(byte);
  }
  return codewords;
}

function chooseVersion(byteLen: number, ecc: QrEcc): number {
  for (let ver = 1; ver <= MAX_VERSION; ver++) {
    const needed = 4 + (ver <= 9 ? 8 : 16) + byteLen * 8;
    if (needed <= dataCodewords(ver, ecc) * 8) return ver;
  }
  throw new Error(
    `QR: text is too long (${byteLen} bytes) for version ${MAX_VERSION} at ECC level ${ecc}`,
  );
}

// ---- Matrix construction ----

class Grid {
  readonly modules: boolean[][];
  readonly isFunction: boolean[][];
  constructor(readonly size: number) {
    this.modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.isFunction = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }
  get(x: number, y: number): boolean {
    return this.modules[y]?.[x] ?? false;
  }
  fn(x: number, y: number): boolean {
    return this.isFunction[y]?.[x] ?? false;
  }
  set(x: number, y: number, dark: boolean): void {
    const row = this.modules[y];
    if (row) row[x] = dark;
  }
  setFunction(x: number, y: number, dark: boolean): void {
    this.set(x, y, dark);
    const row = this.isFunction[y];
    if (row) row[x] = true;
  }
}

function drawFinder(g: Grid, cx: number, cy: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      const dist = Math.max(Math.abs(dx), Math.abs(dy)); // includes 1-module separator
      if (x >= 0 && x < g.size && y >= 0 && y < g.size) g.setFunction(x, y, dist !== 2 && dist !== 4);
    }
  }
}

function drawAlignment(g: Grid, cx: number, cy: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      g.setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
}

/** 15-bit format info: ECC level + mask, BCH(15,5) protected, XOR-masked. */
function drawFormatBits(g: Grid, ecc: QrEcc, mask: number): void {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const s = g.size;

  // First copy, around the top-left finder.
  for (let i = 0; i <= 5; i++) g.setFunction(8, i, bit(bits, i));
  g.setFunction(8, 7, bit(bits, 6));
  g.setFunction(8, 8, bit(bits, 7));
  g.setFunction(7, 8, bit(bits, 8));
  for (let i = 9; i < 15; i++) g.setFunction(14 - i, 8, bit(bits, i));

  // Second copy, split between the top-right and bottom-left finders.
  for (let i = 0; i < 8; i++) g.setFunction(s - 1 - i, 8, bit(bits, i));
  for (let i = 8; i < 15; i++) g.setFunction(8, s - 15 + i, bit(bits, i));
  g.setFunction(8, s - 8, true); // always-dark module
}

/** 18-bit version info (v7+): version + BCH(18,6) remainder, two 6x3 blocks. */
function drawVersionBits(g: Grid, ver: number): void {
  if (ver < 7) return;
  let rem = ver;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = (ver << 12) | rem;
  for (let i = 0; i < 18; i++) {
    const a = g.size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    g.setFunction(a, b, bit(bits, i));
    g.setFunction(b, a, bit(bits, i));
  }
}

function drawFunctionPatterns(g: Grid, ver: number, ecc: QrEcc): void {
  for (let i = 0; i < g.size; i++) {
    g.setFunction(6, i, i % 2 === 0);
    g.setFunction(i, 6, i % 2 === 0);
  }
  drawFinder(g, 3, 3);
  drawFinder(g, g.size - 4, 3);
  drawFinder(g, 3, g.size - 4);

  const pos = alignmentPositions(ver);
  const last = pos.length - 1;
  pos.forEach((x, i) =>
    pos.forEach((y, j) => {
      // Skip the three positions that overlap finder patterns.
      if (!((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0))) {
        drawAlignment(g, x, y);
      }
    }),
  );

  drawFormatBits(g, ecc, 0); // placeholder, reserves the area
  drawVersionBits(g, ver);
}

/** Place codeword bits in the zigzag order (two-column strips, bottom-right upward). */
function drawCodewords(g: Grid, data: readonly number[]): void {
  let i = 0;
  for (let right = g.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip vertical timing column
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < g.size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = upward ? g.size - 1 - vert : vert;
        if (!g.fn(x, y) && i < data.length * 8) {
          g.set(x, y, bit(at(data, i >>> 3), 7 - (i & 7)));
          i++;
        }
        // Remaining (remainder) modules stay light.
      }
    }
  }
}

const MASKS: ReadonlyArray<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** XOR the mask onto data modules. Applying twice undoes it. */
function applyMask(g: Grid, mask: number): void {
  const fn = MASKS[mask];
  if (!fn) throw new Error(`QR: invalid mask ${mask}`);
  for (let y = 0; y < g.size; y++) {
    for (let x = 0; x < g.size; x++) {
      if (!g.fn(x, y) && fn(x, y)) g.set(x, y, !g.get(x, y));
    }
  }
}

// ---- Penalty scoring (ISO 18004 §7.8.3) ----

const FINDER_LIKE = [true, false, true, true, true, false, true];

function lineAt(g: Grid, i: number, j: number, horizontal: boolean): boolean {
  return horizontal ? g.get(j, i) : g.get(i, j);
}

function penalty(g: Grid): number {
  const s = g.size;
  let score = 0;

  for (const horizontal of [true, false]) {
    for (let i = 0; i < s; i++) {
      // Rule 1: runs of 5+ same-colour modules.
      let run = 1;
      for (let j = 1; j <= s; j++) {
        if (j < s && lineAt(g, i, j, horizontal) === lineAt(g, i, j - 1, horizontal)) {
          run++;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      // Rule 3: 1:1:3:1:1 finder-like pattern with 4 light modules on either side.
      for (let j = 0; j + 7 <= s; j++) {
        if (!FINDER_LIKE.every((v, k) => lineAt(g, i, j + k, horizontal) === v)) continue;
        const lightRun = (from: number) =>
          [0, 1, 2, 3].every((k) => !lineAt(g, i, from + k, horizontal)); // out-of-range reads light
        if (lightRun(j - 4) || lightRun(j + 7)) score += 40;
      }
    }
  }

  // Rule 2: 2x2 blocks of one colour.
  for (let y = 0; y < s - 1; y++) {
    for (let x = 0; x < s - 1; x++) {
      const c = g.get(x, y);
      if (c === g.get(x + 1, y) && c === g.get(x, y + 1) && c === g.get(x + 1, y + 1)) score += 3;
    }
  }

  // Rule 4: deviation of dark proportion from 50%, in 5% steps.
  let dark = 0;
  g.modules.forEach((row) => row.forEach((m) => (dark += m ? 1 : 0)));
  const total = s * s;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

export function encodeQr(text: string, ecc: QrEcc = 'M'): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const ver = chooseVersion(bytes.length, ecc);
  const g = new Grid(ver * 4 + 17);

  drawFunctionPatterns(g, ver, ecc);
  drawCodewords(g, addEccAndInterleave(encodeData(bytes, ver, ecc), ver, ecc));

  // Try every mask, keep the one with the lowest penalty.
  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < MASKS.length; mask++) {
    applyMask(g, mask);
    drawFormatBits(g, ecc, mask);
    const score = penalty(g);
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    applyMask(g, mask); // undo
  }
  applyMask(g, best);
  drawFormatBits(g, ecc, best);
  return g.modules;
}
