import type { GameCopy } from '../../engine/types';
import { UI_COPY } from '../../ui/copy';
import styles from './MiniStage.module.css';

/** A tiny shared screen: the first entry on its card, the question, and the timer, so settings feel concrete. */
export function MiniStage({ text, total, timerSec, copy }: { text: string | null; total: number; timerSec: number; copy: GameCopy }) {
  return (
    <figure className={styles.stage} aria-label={UI_COPY.setup.preview}>
      <span className={styles.top} aria-hidden="true">
        <span>
          {copy.item} 1 {UI_COPY.of} {Math.max(total, 1)}
        </span>
        <span>{timerSec}</span>
      </span>
      <span className={styles.card}>
        <span className={styles.label}>{copy.item} 1</span>
        <span className={styles.text}>{text ?? UI_COPY.setup.previewEmpty}</span>
      </span>
      <span className={`text-glow ${styles.question}`}>{copy.question}</span>
    </figure>
  );
}
