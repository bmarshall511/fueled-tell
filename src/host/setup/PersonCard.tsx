import { useId, type ClipboardEvent } from 'react';
import type { RowIssue } from '../../engine/intake';
import { GAME } from '../../content';
import { IconButton } from '../../ui/components/IconButton';
import { TextArea, TextInput } from '../../ui/components/TextField';
import { UI_COPY } from '../../ui/copy';
import { playerColorVar } from '../../ui/lib/playerColor';
import { describeIssues, isFilled, nameIssues, textIssues, type DraftRow } from './draftRows';
import styles from './PersonCard.module.css';

const E = UI_COPY.editor;

interface PersonCardProps {
  row: DraftRow;
  index: number;
  issues: RowIssue[];
  maxLength: number;
  onChange: (patch: Partial<DraftRow>) => void;
  onRemove: () => void;
  onPaste: (e: ClipboardEvent) => void;
}

/** One person, edited in place: avatar, name, their entry with a live count, and any problem with the exact fix. */
export function PersonCard({ row, index, issues, maxLength, onChange, onRemove, onPaste }: PersonCardProps) {
  const ids = { name: useId(), text: useId(), problem: useId(), count: useId() };
  const touched = isFilled(row);
  const problems = touched ? [...nameIssues(issues), ...textIssues(issues)] : [];
  const len = row.text.trim().length;
  const label = row.name.trim() || `${E.row} ${index + 1}`;

  return (
    <li className={`spot ${styles.card} ${problems.length ? styles.bad : ''}`} data-key={row.key}>
      <span className={styles.avatar} style={{ ['--player' as string]: playerColorVar(index) }} aria-hidden="true">
        {row.name.trim().charAt(0).toUpperCase() || index + 1}
      </span>
      <div className={styles.fields}>
        <label htmlFor={ids.name} className="visually-hidden">
          {E.name}, {label}
        </label>
        <TextInput
          id={ids.name}
          tone="bare"
          fieldSize="title"
          className={styles.name}
          value={row.name}
          placeholder={E.name}
          autoComplete="off"
          maxLength={64}
          aria-invalid={nameIssues(problems).length > 0}
          aria-describedby={problems.length ? ids.problem : undefined}
          onChange={(e) => onChange({ name: e.target.value })}
          onPaste={onPaste}
        />
        <label htmlFor={ids.text} className="visually-hidden">
          {GAME.copy.item}, {label}
        </label>
        <TextArea
          id={ids.text}
          tone="bare"
          rows={1}
          autoGrow
          className={styles.text}
          value={row.text}
          placeholder={GAME.copy.item}
          aria-invalid={textIssues(problems).length > 0}
          aria-describedby={`${ids.count}${problems.length ? ` ${ids.problem}` : ''}`}
          onChange={(e) => onChange({ text: e.target.value })}
          onPaste={onPaste}
        />
        <div className={styles.meta}>
          {problems.length > 0 && (
            <span id={ids.problem} className={styles.problem}>
              {describeIssues(problems)}
            </span>
          )}
          <span id={ids.count} className={`${styles.count} ${len > maxLength ? 'text-error' : ''}`}>
            {len}/{maxLength} <span className="visually-hidden">{E.counter}</span>
          </span>
        </div>
      </div>
      <IconButton icon="close" label={`${E.remove} ${label}`} className={styles.remove} onClick={onRemove} />
    </li>
  );
}
