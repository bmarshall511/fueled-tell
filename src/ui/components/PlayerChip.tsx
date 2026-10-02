import { playerColorVar } from '../lib/playerColor';
import type { SeatedPlayer } from '../lib/types';
import styles from './PlayerChip.module.css';

interface PlayerChipProps {
  player: SeatedPlayer;
  size?: 'host' | 'phone';
  /** One line with an ellipsis (tight spots like the phone bar); otherwise long names wrap. */
  truncate?: boolean;
}

export function PlayerChip({ player, size = 'host', truncate }: PlayerChipProps) {
  return (
    <span className={`${styles.chip} ${styles[size]} ${truncate ? styles.truncate : ''}`} title={truncate ? player.name : undefined}>
      <span className={styles.dot} style={{ background: playerColorVar(player.colorIndex) }} aria-hidden="true" />
      <span className={styles.name}>{player.name}</span>
    </span>
  );
}
