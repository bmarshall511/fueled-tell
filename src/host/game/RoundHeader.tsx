import { HostBrand } from '../components/HostBrand';
import { Timer } from './Timer';
import styles from './RoundHeader.module.css';

/** Top of the shared screen during a round: brand, progress, countdown. */
export function RoundHeader({ progress, deadline, durationMs }: { progress: string; deadline: number | null; durationMs: number }) {
  return (
    <header className={styles.header}>
      <HostBrand />
      <span className={`t-label ${styles.progress}`}>{progress}</span>
      <Timer deadline={deadline} durationMs={durationMs} />
    </header>
  );
}
