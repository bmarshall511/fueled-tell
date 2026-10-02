/**
 * Host import of pasted entries. Accepts the formats people actually paste:
 *
 *   Name | entry          Name: entry          Name - entry   (also – and —)
 *   Name<TAB>entry        CSV with quotes      (spreadsheet copy / export, header row optional)
 *   Blocks: a name on its own line, the entry on the following line(s), blank line between people
 *
 * Nothing is ever dropped: every record comes back, with issues the editor can show inline.
 */

export type RowIssue = 'missingName' | 'missingText' | 'tooLong' | 'duplicateName';

export interface ParsedRow {
  /** 1-based source line where the record starts. */
  line: number;
  name: string;
  text: string;
  issues: RowIssue[];
}

/** Slack and chat pastes put a time after the name ("Ann  10:42 AM"): drop it. */
const cleanName = (name: string) => name.replace(/\s+\[?\d{1,2}:\d{2}(?:\s?[AaPp][Mm])?\]?\s*$/, '').trim();

/** A name is short: up to 5 words, no sentence punctuation at the end. */
const looksLikeName = (s: string) => {
  const t = s.trim();
  return t.length > 0 && t.length <= 40 && t.split(/\s+/).length <= 5 && !/[.!?]$/.test(t);
};

const INLINE_SEPARATORS = [/\s*\|\s*/, /\t+/, /:\s+/, /\s+[-–—]\s+/];

function splitInline(line: string): [string, string] | null {
  for (const sep of INLINE_SEPARATORS) {
    const m = sep.exec(line);
    if (!m || m.index === 0) continue;
    const name = line.slice(0, m.index);
    if (sep.source.startsWith(':') || sep.source.includes('–')) {
      if (!looksLikeName(name)) continue; // "Note: ..." inside prose, or a dash mid-sentence
    }
    return [name.trim(), line.slice(m.index + m[0].length).trim()];
  }
  return null;
}

/** RFC 4180-ish CSV (quotes, escaped quotes, newlines inside quotes). */
function parseCsv(input: string): { cells: string[]; line: number }[] {
  const rows: { cells: string[]; line: number }[] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else {
        if (c === '\n') line++;
        cell += c;
      }
    } else if (c === '"' && cell.trim() === '') {
      quoted = true;
      cell = '';
    } else if (c === ',') {
      cells.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++;
      cells.push(cell);
      if (cells.some((x) => x.trim())) rows.push({ cells, line: rowLine });
      cells = [];
      cell = '';
      line++;
      rowLine = line;
    } else cell += c;
  }
  cells.push(cell);
  if (cells.some((x) => x.trim())) rows.push({ cells, line: rowLine });
  return rows;
}

const isHeader = (name: string, text: string) =>
  /^(name|who|player|person)$/i.test(name.trim()) && /^(story|entry|text|answer|submission)/i.test(text.trim());

function detectFormat(lines: string[]): 'inline' | 'csv' | 'blocks' {
  const content = lines.filter((l) => l.trim());
  const inline = content.filter((l) => splitInline(l)).length;
  if (inline >= content.length * 0.6) return 'inline';
  const csvish = content.filter((l) => /^\s*"?[^",]{1,40}"?\s*,/.test(l)).length;
  if (csvish >= content.length * 0.6) return 'csv';
  return lines.some((l) => !l.trim()) ? 'blocks' : 'inline';
}

export function parseEntries(input: string, maxLength: number): ParsedRow[] {
  const normalized = input.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const format = detectFormat(lines);
  const raw: { line: number; name: string; text: string }[] = [];

  if (format === 'csv') {
    for (const { cells, line } of parseCsv(normalized)) {
      const [name = '', ...rest] = cells;
      raw.push({ line, name, text: rest.join(',') });
    }
  } else if (format === 'blocks') {
    let start = -1;
    let block: string[] = [];
    const flush = () => {
      if (!block.length) return;
      const [first = '', ...rest] = block;
      const inline = splitInline(first);
      if (inline && rest.every((l) => splitInline(l))) {
        // A run of "Name | entry" lines inside a blank-line-separated paste: one row per line.
        block.forEach((l, i) => {
          const [name, text] = splitInline(l) ?? ['', l];
          raw.push({ line: start + i, name, text });
        });
      } else if (inline) raw.push({ line: start, name: inline[0], text: [inline[1], ...rest].join(' ') });
      else if (rest.length && looksLikeName(cleanName(first))) raw.push({ line: start, name: first, text: rest.join(' ') });
      else raw.push({ line: start, name: '', text: block.join(' ') });
      block = [];
    };
    lines.forEach((l, i) => {
      if (!l.trim()) return flush();
      if (!block.length) start = i + 1;
      block.push(l.trim());
    });
    flush();
  } else {
    lines.forEach((l, i) => {
      if (!l.trim()) return;
      const split = splitInline(l);
      // A stray spreadsheet row ("Name","entry") in a mostly line-based paste.
      const csv = !split && /^\s*"[^"]{1,40}"\s*,/.test(l) ? parseCsv(l)[0]?.cells : undefined;
      const prev = raw[raw.length - 1];
      const continues = !split && !csv && prev && prev.name && lines[i - 1]?.trim();
      if (split) raw.push({ line: i + 1, name: split[0], text: split[1] });
      else if (csv) raw.push({ line: i + 1, name: csv[0] ?? '', text: csv.slice(1).join(',') });
      else if (continues)
        prev.text = `${prev.text} ${l.trim()}`; // an entry that wrapped onto a second line
      else raw.push({ line: i + 1, name: '', text: l.trim() });
    });
  }

  /** Unwrap "quoted" values from non-CSV pastes (CSV quotes are already handled). */
  const unquote = (v: string) => (format !== 'csv' && /^".*"$/s.test(v.trim()) ? v.trim().slice(1, -1) : v.trim());
  const rows = raw
    .map((r) => ({ ...r, name: cleanName(unquote(r.name)), text: unquote(r.text).replace(/^[|:\-–—]\s*/, '') }))
    .filter((r, i) => !(i === 0 && isHeader(r.name, r.text)));
  return validateRows(rows, maxLength);
}

/** A row with its validation issues attached. */
export type ValidatedRow<T> = T & { issues: RowIssue[] };

/** Recompute issues for editor rows (also used after hand edits). */
export function validateRows<T extends { name: string; text: string }>(rows: readonly T[], maxLength: number): ValidatedRow<T>[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.name.trim().toLowerCase();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return rows.map((r) => {
    const issues: RowIssue[] = [];
    if (!r.name.trim()) issues.push('missingName');
    if (!r.text.trim()) issues.push('missingText');
    if (r.text.trim().length > maxLength) issues.push('tooLong');
    if ((counts.get(r.name.trim().toLowerCase()) ?? 0) > 1) issues.push('duplicateName');
    return { ...r, issues };
  });
}
