import { forwardRef } from 'react';
import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
import styles from './ShortcutsDialog.module.css';

const E = UI_COPY.eggs;

/** The host's keyboard shortcuts (opened with ?), with a hint that there's more to find. */
export const ShortcutsDialog = forwardRef<HTMLDialogElement>(function ShortcutsDialog(_, ref) {
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={E.shortcutsTitle}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
    >
      <h2 className={styles.title}>{E.shortcutsTitle}</h2>
      <dl className={styles.list}>
        {E.shortcuts.map(([key, what]) => (
          <div key={key} className={styles.row}>
            <dt>
              <kbd className={styles.key}>{key}</kbd>
            </dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.more}>{E.shortcutsMore}</p>
      <Button onClick={(e) => e.currentTarget.closest('dialog')?.close()}>{UI_COPY.close}</Button>
    </dialog>
  );
});
