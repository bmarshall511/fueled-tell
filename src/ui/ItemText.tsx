import type { CSSProperties } from 'react';
import styles from './ItemText.module.css';

/** Character count above which the item drops one step in the type scale. */
const LONG_ITEM = 170;

interface ItemTextProps {
  text: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** The active entry, set big for screen share. Shared by every scene. */
export function ItemText({ text, label, className, style }: ItemTextProps) {
  return (
    <figure className={`${styles.item} ${className ?? ''}`} style={style}>
      {label && <figcaption className={`t-label ${styles.label}`}>{label}</figcaption>}
      <blockquote className={`${text.length > LONG_ITEM ? 't-body' : 't-title'} ${styles.text}`}>{text}</blockquote>
    </figure>
  );
}
