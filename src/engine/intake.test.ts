import { describe, expect, it } from 'vitest';
import { parseEntries, validateRows } from './intake';

const names = (rows: { name: string }[]) => rows.map((r) => r.name);

describe('parseEntries', () => {
  it('reads pipe, colon, dash and tab lines', () => {
    const rows = parseEntries('Ada | one\nBo: two\nCy - three\nDee\tfour\nEd — five', 100);
    expect(names(rows)).toEqual(['Ada', 'Bo', 'Cy', 'Dee', 'Ed']);
    expect(rows.map((r) => r.text)).toEqual(['one', 'two', 'three', 'four', 'five']);
    expect(rows.every((r) => r.issues.length === 0)).toBe(true);
  });

  it('does not split prose on a colon or dash', () => {
    const [row] = parseEntries('Ada | Fun fact: I once met a goose - it was rude.', 100);
    expect(row).toMatchObject({ name: 'Ada', text: 'Fun fact: I once met a goose - it was rude.' });
  });

  it('reads CSV with quotes, commas and a header row', () => {
    const rows = parseEntries('name,story\nAda,"Hello, world"\n"Bo",plain\nCy,"She said ""hi"""', 100);
    expect(rows.map((r) => [r.name, r.text])).toEqual([
      ['Ada', 'Hello, world'],
      ['Bo', 'plain'],
      ['Cy', 'She said "hi"'],
    ]);
  });

  it('reads name-then-paragraph blocks', () => {
    const rows = parseEntries('Ada Lovelace\nI once got lost.\nIn a library.\n\nBo\nI ate a bee.', 100);
    expect(rows.map((r) => [r.name, r.text])).toEqual([
      ['Ada Lovelace', 'I once got lost. In a library.'],
      ['Bo', 'I ate a bee.'],
    ]);
  });

  it('keeps unparseable lines as rows with issues instead of dropping them', () => {
    const rows = parseEntries('Ada | ok\nthis line has no name at all.\nBo | ' + 'x'.repeat(20) + '\nada | dupe', 10);
    expect(rows).toHaveLength(4);
    expect(rows[1]?.issues).toContain('missingName');
    expect(rows[2]?.issues).toContain('tooLong');
    expect(rows[0]?.issues).toContain('duplicateName');
    expect(rows[3]?.issues).toContain('duplicateName');
  });
});

describe('validateRows', () => {
  it('flags empty fields', () => {
    expect(validateRows([{ name: '', text: '' }], 10)[0]?.issues).toEqual(['missingName', 'missingText']);
  });
});
