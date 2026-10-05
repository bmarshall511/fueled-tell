import { useRef, type ClipboardEvent } from 'react';
import type { ValidatedRow } from '../../engine/intake';
import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
import { plural } from '../../ui/lib/format';
import { isFilled, type DraftRow } from './draftRows';
import { PersonCard } from './PersonCard';
import styles from './PeopleList.module.css';

const E = UI_COPY.editor;

interface PeopleListProps {
  rows: readonly ValidatedRow<DraftRow>[];
  maxLength: number;
  /** The topic's noun for one entry ("Story", "Movie"). */
  itemNoun: string;
  onUpdate: (key: string, patch: Partial<DraftRow>) => void;
  onRemove: (key: string) => void;
  onPaste: (e: ClipboardEvent) => void;
}

/** Everyone added so far, as cards in a responsive grid, with a count and a jump to the first problem. */
export function PeopleList({ rows, maxLength, itemNoun, onUpdate, onRemove, onPaste }: PeopleListProps) {
  const list = useRef<HTMLOListElement>(null);
  const filled = rows.filter(isFilled);
  const problems = filled.filter((r) => r.issues.length > 0);
  const jump = () => {
    const first = problems[0];
    if (first) list.current?.querySelector<HTMLElement>(`[data-key="${first.key}"] [aria-invalid="true"]`)?.focus();
  };
  if (rows.length === 0) return null;
  return (
    <section className={styles.people} aria-label={plural(filled.length, E.people)}>
      <p className={styles.count} aria-live="polite">
        {plural(filled.length, E.people)}
        {problems.length > 0 && (
          <>
            {' · '}
            <span className="text-error">{plural(problems.length, E.needsFix)}</span>{' '}
            <Button variant="outline" className={styles.jump} onClick={jump}>
              {E.jump}
            </Button>
          </>
        )}
      </p>
      <ol className={styles.cards} ref={list}>
        {rows.map((r, i) => (
          <PersonCard
            key={r.key}
            row={r}
            index={i}
            issues={r.issues}
            maxLength={maxLength}
            itemNoun={itemNoun}
            onChange={(patch) => onUpdate(r.key, patch)}
            onRemove={() => onRemove(r.key)}
            onPaste={onPaste}
          />
        ))}
      </ol>
    </section>
  );
}
