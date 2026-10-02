#!/usr/bin/env node
/**
 * Project rule checks from CLAUDE.md that tsc can't see (dependency-free; ESLint's
 * TypeScript parser doesn't support TypeScript 7 yet):
 *   1. No hex colors outside tokens/ (generated token files excepted).
 *   2. /play's import graph never reaches Three.js / R3F.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const failures = [];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// 1. Hex colors
const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/g;
for (const file of walk(src)) {
  if (!/\.(tsx?|css)$/.test(file) || file.includes(`${join('src', 'tokens')}`)) continue;
  const text = readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const code = line.replace(/\/\/.*$/, '');
    // ignore URL fragments like '#root' and element ids
    const hits = [...code.matchAll(HEX)].filter((m) => /^#[0-9a-fA-F]+$/.test(m[0]) && !/getElementById|querySelector/.test(code));
    if (hits.length) failures.push(`hex color in ${relative(root, file)}: ${line.trim()}`);
  }
}

// 2. /play must not reach Three.js
const IMPORT = /(?:^|\n)\s*import\s+(?!type\b)(?:[^'"]*?from\s+)?['"]([^'"]+)['"]/g;
const resolveImport = (from, spec) => {
  if (!spec.startsWith('.')) return spec;
  const base = resolve(dirname(from), spec);
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    try {
      if (statSync(base + ext).isFile()) return base + ext;
    } catch {
      /* next */
    }
  }
  return null;
};
const seen = new Set();
const stack = [[join(src, 'routes', 'Play.tsx'), ['routes/Play.tsx']]];
while (stack.length) {
  const [file, chain] = stack.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  const text = readFileSync(file, 'utf8');
  for (const [, spec] of text.matchAll(IMPORT)) {
    const target = resolveImport(file, spec);
    if (!target) continue;
    if (/^(three|@react-three\/)/.test(target)) failures.push(`/play reaches ${target} via ${chain.join(' -> ')}`);
    else if (target.startsWith(src) && /\.(tsx?)$/.test(target)) stack.push([target, [...chain, relative(src, target)]]);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`rules ok: no hex colors outside tokens; /play graph (${seen.size} modules) is free of Three.js`);
