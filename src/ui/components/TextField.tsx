import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useAutoGrow } from '../hooks/useAutoGrow';
import styles from './TextField.module.css';

/** `body` for forms; `title` for one big field (a name); `code` for the room code. */
type FieldSize = 'body' | 'title' | 'code';

type InputProps = InputHTMLAttributes<HTMLInputElement> & { fieldSize?: FieldSize };
type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { fieldSize?: FieldSize; autoGrow?: boolean; tone?: 'raised' | 'sunken' };

const cls = (size: FieldSize, extra?: string) => `chamfer ${styles.field} ${styles[size]} ${extra ?? ''}`;

/** The one text input style: raised, chamfered, token-sized; `aria-invalid` shows the error rule. */
export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput({ fieldSize = 'body', className, ...rest }, ref) {
  return <input ref={ref} className={cls(fieldSize, className)} {...rest} />;
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
    <textarea
      ref={ref}
      className={cls(
        fieldSize,
        `${styles.area} ${autoGrow ? styles.grow : ''} ${tone === 'sunken' ? styles.sunken : ''} ${className ?? ''}`,
      )}
      {...rest}
    />
  );
});
