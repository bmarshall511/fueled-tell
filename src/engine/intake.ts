/** Host import: parse pasted `Name | entry` lines (also accepts tab or first comma, for CSV). */

export interface ParsedRow {
  line: number;
  name: string;
  text: string;
}

export type ParseErrorCode = 'missingSeparator' | 'missingName' | 'missingText' | 'tooLong';

export interface ParseError {
  line: number;
  code: ParseErrorCode;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: ParseError[];
}

const SEPARATORS = ['|', '\t', ','] as const;

export function parseEntries(input: string, maxLength: number): ParseResult {
  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];
  input.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    if (!raw.trim()) return;
    const sep = SEPARATORS.find((s) => raw.includes(s));
    if (!sep) return errors.push({ line, code: 'missingSeparator' });
    const at = raw.indexOf(sep);
    const name = raw.slice(0, at).trim();
    const text = raw.slice(at + 1).trim().replace(/^"|"$/g, '');
    if (!name) return errors.push({ line, code: 'missingName' });
    if (!text) return errors.push({ line, code: 'missingText' });
    if (text.length > maxLength) return errors.push({ line, code: 'tooLong' });
    rows.push({ line, name, text });
  });
  return { rows, errors };
}
