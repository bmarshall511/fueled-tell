import { useEffect, useId, useMemo, useRef, useState, type ClipboardEvent } from 'react';
import { parseEntries, validateRows, type RowIssue } from '../engine/intake';
import sampleEntries from '../packs/sample-entries.json';
import { Button } from '../ui/Button';
import { UI_COPY } from '../ui/copy';
import styles from './EntriesEditor.module.css';

const E = UI_COPY.editor;

export interface DraftRow {
  key: string;
  name: string;
  text: string;
}

let keySeq = 0;
export const newRow = (name = '', text = ''): DraftRow => ({ key: `r${++keySeq}`, name, text });

interface EntriesEditorProps {
  rows: DraftRow[];
  onChange: (rows: DraftRow[]) => void;
  maxLength: number;
  itemNoun: string;
}

/**
 * One row per person, validated as you type. Pasting a multi-line list into any
 * field (or the "Paste a list" helper) previews every parsed row before adding,
 * and rows that need attention are kept and highlighted, never dropped.
 */
export function EntriesEditor({ rows, onChange, maxLength, itemNoun }: EntriesEditorProps) {
  const validated = useMemo(() => validateRows(rows, maxLength), [rows, maxLength]);
  // A brand-new blank row isn't a problem yet; anything half-filled is.
  const problems = validated.filter((r) => r.issues.length > 0 && (r.name.trim() || r.text.trim()));
  const ready = validated.filter((r) => r.issues.length === 0).length;
  const [pasting, setPasting] = useState<string | null>(null);
  const focusKey = useRef<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const fileId = useId();

  useEffect(() => {
    if (!focusKey.current) return;
    listRef.current?.querySelector<HTMLInputElement>(`[data-key="${focusKey.current}"] input`)?.focus();
    focusKey.current = null;
  });

  const update = (key: string, patch: Partial<DraftRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => onChange(rows.filter((r) => r.key !== key));
  const add = () => {
    const row = newRow();
    focusKey.current = row.key;
    onChange([...rows.filter((r) => r.name.trim() || r.text.trim()), row]);
  };
  const jump = () => {
    const first = problems[0];
    if (first) listRef.current?.querySelector<HTMLElement>(`[data-key="${first.key}"] [aria-invalid="true"]`)?.focus();
  };

  /** A multi-line paste into a single field is almost always a whole list: offer the helper. */
  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text.split(/\r?\n/).filter((l) => l.trim()).length >= 2) {
      e.preventDefault();
      setPasting(text);
    }
  };

  const importFile = async (file: File) => setPasting(await file.text());

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <Button variant="secondary" onClick={() => setPasting('')}>
          {E.paste}
        </Button>
        <label className={`chamfer ${styles.fileBtn}`} htmlFor={fileId}>
          {E.importFile}
          <input
            id={fileId}
            type="file"
            accept=".csv,.tsv,.txt,text/plain,text/csv"
            className="visually-hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = '';
            }}
          />
        </label>
        <Button
          variant="secondary"
          onClick={() =>
            onChange([...rows.filter((r) => r.name.trim() || r.text.trim()), ...sampleEntries.map((s) => newRow(s.name, s.text))])
          }
        >
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
            const kept = mode === 'add' ? rows.filter((r) => r.name.trim() || r.text.trim()) : [];
            onChange([...kept, ...incoming]);
            setPasting(null);
          }}
        />
      )}

      {rows.length === 0 ? (
        <p className={styles.empty}>{E.empty}</p>
      ) : (
        <ol className={styles.rows} ref={listRef}>
          {validated.map((r, i) => (
            <Row
              key={r.key}
              row={r}
              index={i}
              issues={r.issues}
              maxLength={maxLength}
              itemNoun={itemNoun}
              onChange={(patch) => update(r.key, patch)}
              onRemove={() => remove(r.key)}
              onAddNext={add}
              onPaste={onPaste}
            />
          ))}
        </ol>
      )}

      <div className={styles.footer}>
        <Button variant="secondary" onClick={add}>
          + {E.add}
        </Button>
        <p className={styles.status} aria-live="polite">
          <strong>{ready}</strong> {E.ready}
          {problems.length > 0 && (
            <>
              {' · '}
              <span className={styles.bad}>
                {problems.length} {E.needsFix}
              </span>{' '}
              <button type="button" className={styles.link} onClick={jump}>
                {E.jump}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

interface RowProps {
  row: DraftRow;
  index: number;
  issues: RowIssue[];
  maxLength: number;
  itemNoun: string;
  onChange: (patch: Partial<DraftRow>) => void;
  onRemove: () => void;
  onAddNext: () => void;
  onPaste: (e: ClipboardEvent) => void;
}

function Row({ row, index, issues, maxLength, itemNoun, onChange, onRemove, onAddNext, onPaste }: RowProps) {
  const ids = { name: useId(), text: useId(), nameErr: useId(), textErr: useId(), count: useId() };
  const nameIssues = issues.filter((i) => i === 'missingName' || i === 'duplicateName');
  const textIssues = issues.filter((i) => i === 'missingText' || i === 'tooLong');
  const empty = !row.name.trim() && !row.text.trim();
  // Don't nag about a brand-new blank row.
  const showName = !empty && nameIssues.length > 0;
  const showText = !empty && textIssues.length > 0;
  const len = row.text.trim().length;
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea with its content.
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [row.text]);

  return (
    <li className={`chamfer ${styles.row} ${showName || showText ? styles.rowBad : ''}`} data-key={row.key}>
      <span className={styles.num} aria-hidden="true">
        {index + 1}
      </span>
      <div className={styles.nameCell}>
        <label htmlFor={ids.name} className="visually-hidden">
          {E.name}, {E.row} {index + 1}
        </label>
        <input
          id={ids.name}
          className={`chamfer ${styles.input}`}
          value={row.name}
          placeholder={E.name}
          autoComplete="off"
          maxLength={64}
          aria-invalid={showName}
          aria-describedby={showName ? ids.nameErr : undefined}
          onChange={(e) => onChange({ name: e.target.value })}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              textRef.current?.focus();
            }
          }}
        />
        {showName && (
          <span id={ids.nameErr} className={styles.issue}>
            {nameIssues.map((i) => E.issues[i]).join(' · ')}
          </span>
        )}
      </div>
      <div className={styles.textCell}>
        <label htmlFor={ids.text} className="visually-hidden">
          {itemNoun}, {E.row} {index + 1}
        </label>
        <textarea
          id={ids.text}
          ref={textRef}
          rows={1}
          className={`chamfer ${styles.textarea}`}
          value={row.text}
          placeholder={itemNoun}
          aria-invalid={showText}
          aria-describedby={`${ids.count}${showText ? ` ${ids.textErr}` : ''}`}
          onChange={(e) => onChange({ text: e.target.value })}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onAddNext();
            }
          }}
        />
        <span className={styles.meta}>
          {showText && (
            <span id={ids.textErr} className={styles.issue}>
              {textIssues.map((i) => E.issues[i]).join(' · ')}
            </span>
          )}
          <span id={ids.count} className={`${styles.count} ${len > maxLength ? styles.bad : ''}`}>
            {len}/{maxLength} <span className="visually-hidden">{E.counter}</span>
          </span>
        </span>
      </div>
      <button
        type="button"
        className={styles.remove}
        onClick={onRemove}
        aria-label={`${E.remove} ${E.row.toLowerCase()} ${index + 1}${row.name ? ` (${row.name})` : ''}`}
      >
        ×
      </button>
    </li>
  );
}

interface PasteHelperProps {
  initial: string;
  maxLength: number;
  onCancel: () => void;
  onApply: (rows: { name: string; text: string }[], mode: 'add' | 'replace') => void;
}

/** Paste box with a live preview of exactly what will be added. */
function PasteHelper({ initial, maxLength, onCancel, onApply }: PasteHelperProps) {
  const [text, setText] = useState(initial);
  const parsed = useMemo(() => parseEntries(text, maxLength), [text, maxLength]);
  const ids = { area: useId(), help: useId(), title: useId() };
  const areaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => areaRef.current?.focus(), []);
  const bad = parsed.filter((r) => r.issues.length).length;

  return (
    <section className={`chamfer ${styles.paste}`} aria-labelledby={ids.title}>
      <h3 id={ids.title} className={styles.pasteTitle}>
        {E.pasteTitle}
      </h3>
      <p id={ids.help} className={styles.help}>
        {E.pasteHelp}
      </p>
      <div className={styles.pasteGrid}>
        <div className={styles.field}>
          <label htmlFor={ids.area} className={styles.fieldLabel}>
            {E.pasteLabel}
          </label>
          <textarea
            id={ids.area}
            ref={areaRef}
            className={`chamfer ${styles.pasteArea}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby={ids.help}
            spellCheck={false}
            onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel} aria-live="polite">
            {E.preview}: {parsed.length} {E.people}
            {bad > 0 && (
              <>
                {' · '}
                <span className={styles.bad}>
                  {bad} {E.needsFix}
                </span>
              </>
            )}
          </span>
          <ol className={styles.preview}>
            {parsed.map((r) => (
              <li key={`${r.line}-${r.name}`} className={`chamfer ${styles.previewRow} ${r.issues.length ? styles.rowBad : ''}`}>
                <span className={styles.previewName}>{r.name || '—'}</span>
                <span className={styles.previewText}>{r.text || '—'}</span>
                {r.issues.length > 0 && <span className={styles.issue}>{r.issues.map((i) => E.issues[i]).join(' · ')}</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className={styles.pasteActions}>
        <Button variant="secondary" onClick={onCancel}>
          {E.cancel}
        </Button>
        <Button variant="secondary" disabled={!parsed.length} onClick={() => onApply(parsed, 'replace')}>
          {E.replaceRows}
        </Button>
        <Button disabled={!parsed.length} onClick={() => onApply(parsed, 'add')}>
          {E.addRows} ({parsed.length})
        </Button>
      </div>
    </section>
  );
}
