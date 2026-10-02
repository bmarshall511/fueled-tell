import { useId, useRef, type ClipboardEvent } from 'react';
import type { RowIssue } from '../../engine/intake';
import { TextArea, TextInput } from '../../ui/components/TextField';
import { UI_COPY } from '../../ui/copy';
import { describeIssues, isFilled, nameIssues, textIssues, type DraftRow } from './draftRows';
import styles from './EntryRow.module.css';

const E = UI_COPY.editor;

interface EntryRowProps {
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

/** One person: name, entry (with a live character count) and remove. Issues show inline once the row is touched. */
export function EntryRow({ row, index, issues, maxLength, itemNoun, onChange, onRemove, onAddNext, onPaste }: EntryRowProps) {
  const ids = { name: useId(), text: useId(), nameErr: useId(), textErr: useId(), count: useId() };
  const touched = isFilled(row);
  const nameProblems = touched ? nameIssues(issues) : [];
  const textProblems = touched ? textIssues(issues) : [];
  const len = row.text.trim().length;
  const textRef = useRef<HTMLTextAreaElement>(null);

  return (
    <li className={`chamfer ${styles.row} ${nameProblems.length || textProblems.length ? styles.bad : ''}`} data-key={row.key}>
      <span className={styles.num} aria-hidden="true">
        {index + 1}
      </span>
      <div className={styles.cell}>
        <label htmlFor={ids.name} className="visually-hidden">
          {E.name}, {E.row} {index + 1}
        </label>
        <TextInput
          id={ids.name}
          value={row.name}
          placeholder={E.name}
          autoComplete="off"
          maxLength={64}
          aria-invalid={nameProblems.length > 0}
          aria-describedby={nameProblems.length ? ids.nameErr : undefined}
          onChange={(e) => onChange({ name: e.target.value })}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            textRef.current?.focus();
          }}
        />
        {nameProblems.length > 0 && (
          <span id={ids.nameErr} className="text-hint text-error">
            {describeIssues(nameProblems)}
          </span>
        )}
      </div>
      <div className={`${styles.cell} ${styles.text}`}>
        <label htmlFor={ids.text} className="visually-hidden">
          {itemNoun}, {E.row} {index + 1}
        </label>
        <TextArea
          id={ids.text}
          ref={textRef}
          rows={1}
          autoGrow
          value={row.text}
          placeholder={itemNoun}
          aria-invalid={textProblems.length > 0}
          aria-describedby={`${ids.count}${textProblems.length ? ` ${ids.textErr}` : ''}`}
          onChange={(e) => onChange({ text: e.target.value })}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
            e.preventDefault();
            onAddNext();
          }}
        />
        <span className={styles.meta}>
          {textProblems.length > 0 && (
            <span id={ids.textErr} className="text-hint text-error">
              {describeIssues(textProblems)}
            </span>
          )}
          <span id={ids.count} className={`text-hint ${styles.count} ${len > maxLength ? 'text-error' : ''}`}>
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
