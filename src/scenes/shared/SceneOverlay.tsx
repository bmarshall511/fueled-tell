import type { ReactNode } from 'react';
import styles from './SceneOverlay.module.css';

/** HTML layer above the canvas, centered on the item area. Text stays crisp and accessible. */
export function SceneOverlay({ children }: { children: ReactNode }) {
  return <div className={styles.overlay}>{children}</div>;
}
