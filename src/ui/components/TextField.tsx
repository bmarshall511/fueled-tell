import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useAutoGrow } from '../hooks/useAutoGrow';
import styles from './TextField.module.css';

/** `body` for forms; `title` for one big field (a name); `code` for the room code. */
type FieldSize = 'body' | 'title' | 'code';

/** `sunken` for a field that sits on a raised surface (a card). */
type Tone = 'raised' | 'sunken';

type InputProps = InputHTMLAttributes<HTMLInputElement> & { fieldSize?: FieldSize; tone?: Tone };
type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { fieldSize?: FieldSize; tone?: Tone; autoGrow?: boolean };

const cls = (size: FieldSize, tone: Tone, extra?: string) =>
  `chamfer ${styles.field} ${styles[size]} ${tone === 'sunken' ? styles.sunken : ''} ${extra ?? ''}`;

/** The one text input style: raised, chamfered, token-sized; `aria-invalid` shows the error rule. */
export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput(
  { fieldSize = 'body', tone = 'raised', className, ...rest },
  ref,
) {
  return <input ref={ref} className={cls(fieldSize, tone, className)} {...rest} />;
});

/** Multi-line twin of TextInput. `autoGrow` fits the content (and re-measures on resize). */
export const TextArea = forwardRef<HTMLTextAreaElement, AreaProps>(function TextArea(
  { fieldSize = 'body', autoGrow, tone = 'raised', className, ...rest },
  forwarded,
) {
  const grow = useAutoGrow(autoGrow ? String(rest.value ?? '') : null);
  const ref = (el: HTMLTextAreaElement | null) => {
    grow.current = el;
    if (typeof forwarded === 'function') forwarded(el);
    else if (forwarded) forwarded.current = el;
  };
  return (
    <textarea ref={ref} className={cls(fieldSize, tone, `${styles.area} ${autoGrow ? styles.grow : ''} ${className ?? ''}`)} {...rest} />
  );
});
