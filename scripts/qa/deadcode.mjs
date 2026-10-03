// Unused CSS-module classes, unused exports, unused tokens, unused copy keys.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = join(root, 'src');
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(src);
const code = files.filter((f) => /\.(tsx?|mjs)$/.test(f));
const all = code.map((f) => readFileSync(f, 'utf8')).join('\n');
// 1. CSS module classes
for (const css of files.filter((f) => f.endsWith('.module.css'))) {
  const text = readFileSync(css, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = [...new Set([...text.matchAll(/\.([a-zA-Z][\w]*)/g)].map((m) => m[1]))].filter((c) => !/^(t|chamfer|fade|visually)/.test(c));
  const users = code.filter((f) => readFileSync(f, 'utf8').includes(basename(css)));
  const usedText = users.map((f) => readFileSync(f, 'utf8')).join('\n');
  const unused = classes.filter((c) => !new RegExp(`styles\\.${c}\\b|styles\\[\\\`[^\\]]*${c.replace(/\d+$/, '')}|['"\`]${c}['"\`]`).test(usedText) && !(text.includes(`:global(.${c})`)));
  if (unused.length) console.log('CSS', css.replace(src + '/', ''), '→ unused:', unused.join(', '));
}
// 2. Exports never imported elsewhere
for (const f of code.filter((x) => !x.includes('.test.'))) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/export (?:const|function|class|interface|type|async function) (\w+)/g)) {
    const name = m[1];
    const others = code.filter((o) => o !== f).map((o) => readFileSync(o, 'utf8')).join('\n');
    const usedElsewhere = new RegExp(`\\b${name}\\b`).test(others);
    const usedInside = (t.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length > 1;
    if (!usedElsewhere) console.log('EXPORT', f.replace(src + '/', ''), name, usedInside ? '(used locally only)' : '(UNUSED)');
  }
}
// 3. Tokens not referenced (css var or tokens.ts path)
const tokensCss = readFileSync(join(src, 'tokens/tokens.css'), 'utf8');
const cssAll = files.filter((f) => f.endsWith('.css') && !f.includes('tokens/')).map((f) => readFileSync(f, 'utf8')).join('\n') + readFileSync(join(root, 'vite.config.ts'), 'utf8');
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
for (const [, name] of tokensCss.matchAll(/(--[\w-]+):/g)) {
  const parts = name.slice(2).split('-');
  const tsPath = parts.length > 1 ? camel(parts.slice(1).join('-')) : null;
  const viaVar = cssAll.includes(`var(${name})`) || all.includes(name) || tokensCss.split('\n').filter((l) => l.includes(`var(${name})`)).length > 0;
  const viaTs = tsPath && new RegExp(`tokens\\.[\\w.\\[\\]'"]*${tsPath}\\b`).test(all);
  if (!viaVar && !viaTs) console.log('TOKEN', name);
}
// 4. Copy keys
const copy = readFileSync(join(src, 'ui/copy.ts'), 'utf8');
for (const [, key] of copy.matchAll(/^\s{2,6}(\w+):/gm)) {
  const uses = (all.match(new RegExp(`\\.${key}\\b`, 'g')) ?? []).length;
  if (!uses) console.log('COPY', key);
}
