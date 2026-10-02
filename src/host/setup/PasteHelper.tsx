import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { parseEntries } from '../../engine/intake';
import { Button } from '../../ui/components/Button';
import { TextArea } from '../../ui/components/TextField';
import { UI_COPY } from '../../ui/copy';
import { plural } from '../../ui/lib/format';
import { describeIssues } from './draftRows';
import styles from './PasteHelper.module.css';

const E = UI_COPY.editor;

interface PasteHelperProps {
  initial: string;
  maxLength: number;
  onCancel: () => void;
  onApply: (rows: { name: string; text: string }[], mode: 'add' | 'replace') => void;
}

/** Paste box with a live preview of exactly what will be added (rows that need a fix are shown, not dropped). */
export function PasteHelper({ initial, maxLength, onCancel, onApply }: PasteHelperProps) {
  const [text, setText] = useState(initial);
  const parsed = useMemo(() => parseEntries(text, maxLength), [text, maxLength]);
  const bad = parsed.filter((r) => r.issues.length).length;
  const ids = { area: useId(), help: useId(), title: useId() };
  const areaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => areaRef.current?.focus(), []);

  return (
    <section className={`chamfer ${styles.panel}`} aria-labelledby={ids.title}>
      <h3 id={ids.title} className={styles.title}>
        {E.pasteTitle}
      </h3>
      <p id={ids.help} className={`text-body text-muted ${styles.help}`}>
        {E.pasteHelp}
      </p>
      <div className={styles.grid}>
        <div className={styles.column}>
          <label htmlFor={ids.area} className="text-label">
            {E.pasteLabel}
          </label>
          <TextArea
            id={ids.area}
            ref={areaRef}
            tone="sunken"
            className={styles.area}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby={ids.help}
            spellCheck={false}
            onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          />
        </div>
        <div className={styles.column}>
          <span className="text-label" aria-live="polite">
            {E.preview}: {plural(parsed.length, E.people)}
            {bad > 0 && (
              <>
                {' · '}
                <span className="text-error">{plural(bad, E.needsFix)}</span>
              </>
            )}
          </span>
          <ol className={styles.preview}>
            {parsed.map((r) => (
              <li key={`${r.line}-${r.name}`} className={`chamfer ${styles.previewRow} ${r.issues.length ? styles.bad : ''}`}>
                <span className={styles.previewName}>{r.name || '—'}</span>
                <span className="text-body">{r.text || '—'}</span>
                {r.issues.length > 0 && <span className="text-hint text-error">{describeIssues(r.issues)}</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className={styles.actions}>
        <Button variant="outline" onClick={onCancel}>
          {E.cancel}
        </Button>
        <Button variant="outline" disabled={!parsed.length} onClick={() => onApply(parsed, 'replace')}>
          {E.replaceRows}
        </Button>
        <Button disabled={!parsed.length} onClick={() => onApply(parsed, 'add')}>
          {E.addRows} ({parsed.length})
        </Button>
      </div>
    </section>
  );
}
