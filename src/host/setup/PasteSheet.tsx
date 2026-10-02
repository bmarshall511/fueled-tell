import { useEffect, useRef } from 'react';
import { IconButton } from '../../ui/components/IconButton';
import { UI_COPY } from '../../ui/copy';
import { PasteHelper } from './PasteHelper';
import styles from './PasteSheet.module.css';

interface PasteSheetProps {
  /** Text to start with (a list pasted into a field), or '' for an empty paste box. */
  initial: string;
  maxLength: number;
  onClose: () => void;
  onApply: (rows: { name: string; text: string }[], mode: 'add' | 'replace') => void;
}

/** The paste helper as a modal sheet over the studio (Escape and the backdrop close it). */
export function PasteSheet({ initial, maxLength, onClose, onApply }: PasteSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-label={UI_COPY.editor.pasteTitle}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <IconButton icon="close" label={UI_COPY.editor.close} tip="below" className={styles.close} onClick={onClose} />
      <PasteHelper initial={initial} maxLength={maxLength} onCancel={onClose} onApply={onApply} />
    </dialog>
  );
}
