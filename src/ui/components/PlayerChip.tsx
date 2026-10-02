import { playerColorVar } from '../lib/playerColor';
import type { SeatedPlayer } from '../lib/types';
import styles from './PlayerChip.module.css';

export function PlayerChip({ player, size = 'host' }: { player: SeatedPlayer; size?: 'host' | 'phone' }) {
  return (
    <span className={`chamfer ${styles.chip} ${styles[size]}`}>
      <span className={styles.dot} style={{ background: playerColorVar(player.colorIndex) }} aria-hidden="true" />
      {player.name}
    </span>
  );
}
