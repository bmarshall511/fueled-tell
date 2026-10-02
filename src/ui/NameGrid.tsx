import type { PlayerId } from '../engine/types';
import { playerColorVar } from './playerColor';
import type { SeatedPlayer } from './types';
import styles from './NameGrid.module.css';

interface NameGridProps {
  players: readonly SeatedPlayer[];
  selectedId: PlayerId | null;
  disabledIds?: readonly PlayerId[];
  onSelect: (id: PlayerId) => void;
}

/** Phone guess picker: one big tap target per player. */
export function NameGrid({ players, selectedId, disabledIds = [], onSelect }: NameGridProps) {
  return (
    <div className={styles.grid} role="radiogroup">
      {players.map((p) => {
        const selected = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabledIds.includes(p.id)}
            className={`chamfer ${styles.cell} ${selected ? styles.selected : ''}`}
            style={{ ['--player' as string]: playerColorVar(p.colorIndex) }}
            onClick={() => onSelect(p.id)}
          >
            <span className={styles.swatch} aria-hidden="true" />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
