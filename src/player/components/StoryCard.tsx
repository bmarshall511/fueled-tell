import type { PlayerView } from '../../engine/redact';
import { UI_COPY } from '../../ui/copy';
import styles from './StoryCard.module.css';

/** The current entry, so players never have to remember it. `compact` is the quieter dark version. */
export function StoryCard({ view, itemNoun, compact }: { view: PlayerView; itemNoun: string; compact?: boolean }) {
  if (!view.item) return null;
  return (
    <figure className={`chamfer ${styles.card} ${compact ? styles.compact : ''}`}>
      <figcaption className={styles.label}>
        {itemNoun} {view.index + 1} {UI_COPY.of} {view.total}
      </figcaption>
      <blockquote className={styles.text}>{view.item.text}</blockquote>
    </figure>
  );
}
