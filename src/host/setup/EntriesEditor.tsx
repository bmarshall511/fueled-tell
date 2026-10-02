import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react';
import { validateRows } from '../../engine/intake';
import sampleEntries from '../../content/sample-entries.json';
import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
import { plural } from '../../ui/lib/format';
import { filledRows, isFilled, newRow, type DraftRow } from './draftRows';
import { EntryRow } from './EntryRow';
import { PasteHelper } from './PasteHelper';
import styles from './EntriesEditor.module.css';

const E = UI_COPY.editor;

interface EntriesEditorProps {
  rows: DraftRow[];
  onChange: (rows: DraftRow[]) => void;
  maxLength: number;
  itemNoun: string;
}

/** A pasted block with 2+ non-empty lines is almost certainly a whole list. */
const looksLikeList = (text: string) => text.split(/\r?\n/).filter((l) => l.trim()).length >= 2;

/**
 * One row per person, validated as you type. Pasting a multi-line list into any
 * field (or the "Paste a list" helper) previews every parsed row before adding,
 * and rows that need attention are kept and highlighted, never dropped.
 */
export function EntriesEditor({ rows, onChange, maxLength, itemNoun }: EntriesEditorProps) {
  const validated = useMemo(() => validateRows(rows, maxLength), [rows, maxLength]);
  const problems = validated.filter((r) => r.issues.length > 0 && isFilled(r));
  const ready = validated.filter((r) => r.issues.length === 0).length;
  const [pasting, setPasting] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const focusKey = useRef<string | null>(null);

  // Focus the name field of a just-added row.
  useEffect(() => {
    if (!focusKey.current) return;
    list.current?.querySelector<HTMLInputElement>(`[data-key="${focusKey.current}"] input`)?.focus();
    focusKey.current = null;
  });

  const update = (key: string, patch: Partial<DraftRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const add = () => {
    const row = newRow();
    focusKey.current = row.key;
    onChange([...filledRows(rows), row]);
  };
  const jumpToProblem = () => {
    const first = problems[0];
    if (first) list.current?.querySelector<HTMLElement>(`[data-key="${first.key}"] [aria-invalid="true"]`)?.focus();
  };
  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!looksLikeList(text)) return;
    e.preventDefault();
    setPasting(text);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.bar}>
        <Button variant="secondary" onClick={() => setPasting('')}>
          {E.paste}
        </Button>
        <Button variant="secondary" onClick={() => onChange([...filledRows(rows), ...sampleEntries.map((s) => newRow(s.name, s.text))])}>
          {E.sample}
        </Button>
        {rows.length > 0 && (
          <Button variant="secondary" onClick={() => window.confirm(E.clearConfirm) && onChange([])}>
            {E.clear}
          </Button>
        )}
      </div>

      {pasting !== null && (
        <PasteHelper
          initial={pasting}
          maxLength={maxLength}
          onCancel={() => setPasting(null)}
          onApply={(parsed, mode) => {
            const incoming = parsed.map((p) => newRow(p.name, p.text));
            onChange([...(mode === 'add' ? filledRows(rows) : []), ...incoming]);
            setPasting(null);
          }}
        />
      )}

      {rows.length === 0 ? (
        <p className={`text-body text-muted ${styles.empty}`}>{E.empty}</p>
      ) : (
        <ol className={styles.rows} ref={list}>
          {validated.map((r, i) => (
            <EntryRow
              key={r.key}
              row={r}
              index={i}
              issues={r.issues}
              maxLength={maxLength}
              itemNoun={itemNoun}
              onChange={(patch) => update(r.key, patch)}
              onRemove={() => onChange(rows.filter((x) => x.key !== r.key))}
              onAddNext={add}
              onPaste={onPaste}
            />
          ))}
        </ol>
      )}

      <div className={`${styles.bar} ${styles.footer}`}>
        <Button variant="secondary" onClick={add}>
          + {E.add}
        </Button>
        <p className="text-body text-muted" aria-live="polite">
          <strong className={styles.strong}>{ready}</strong> {E.ready}
          {problems.length > 0 && (
            <>
              {' · '}
              <span className="text-error">{plural(problems.length, E.needsFix)}</span>{' '}
              <button type="button" className={styles.link} onClick={jumpToProblem}>
                {E.jump}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
