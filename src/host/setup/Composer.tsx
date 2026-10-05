import { forwardRef, useId, useRef, useState, type ClipboardEvent } from 'react';
import { Button } from '../../ui/components/Button';
import { TextArea, TextInput } from '../../ui/components/TextField';
import { UI_COPY } from '../../ui/copy';
import styles from './Composer.module.css';

const E = UI_COPY.editor;

interface ComposerProps {
  /** The topic's noun for one entry ("Story", "Movie"). */
  itemNoun: string;
  onAdd: (name: string, text: string) => void;
  onPaste: (e: ClipboardEvent) => void;
  /** Easter egg: the secret name with no entry, then Enter. */
  onSecret: () => void;
}

/**
 * Quick add: a name, their entry, Enter. Enter in the name moves to the entry; Enter in the
 * entry adds the person (Shift+Enter for a new line) and returns to the name for the next one.
 */
export const Composer = forwardRef<HTMLInputElement, ComposerProps>(function Composer({ itemNoun, onAdd, onPaste, onSecret }, nameRef) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const ids = { name: useId(), text: useId() };
  const canAdd = Boolean(name.trim() || text.trim());

  const add = () => {
    if (!canAdd) return;
    onAdd(name.trim(), text.trim());
    setName('');
    setText('');
    if (typeof nameRef === 'object') nameRef?.current?.focus();
  };

  return (
    <div className={`spot ${styles.composer}`}>
      <label htmlFor={ids.name} className="visually-hidden">
        {E.name}
      </label>
      <TextInput
        id={ids.name}
        ref={nameRef}
        tone="sunken"
        value={name}
        placeholder={E.name}
        autoComplete="off"
        maxLength={64}
        onChange={(e) => setName(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (name.trim().toLowerCase() === UI_COPY.eggs.legendsKey && !text.trim()) {
            setName('');
            return onSecret();
          }
          textRef.current?.focus();
        }}
      />
      <label htmlFor={ids.text} className="visually-hidden">
        {itemNoun}
      </label>
      <TextArea
        id={ids.text}
        ref={textRef}
        tone="sunken"
        rows={1}
        autoGrow
        className={styles.text}
        value={text}
        placeholder={itemNoun}
        onChange={(e) => setText(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.shiftKey) return;
          e.preventDefault();
          add();
        }}
      />
      <Button className={styles.add} disabled={!canAdd} onClick={add} shortcut={E.addKey}>
        {E.add}
      </Button>
    </div>
  );
});
