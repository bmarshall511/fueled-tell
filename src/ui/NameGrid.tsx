import { useId } from 'react';
import type { PlayerId } from '../engine/types';
import { playerColorVar } from './playerColor';
import type { SeatedPlayer } from './types';
import styles from './NameGrid.module.css';

interface NameGridProps {
  players: readonly SeatedPlayer[];
  selectedId: PlayerId | null;
  disabledIds?: readonly PlayerId[];
  onSelect: (id: PlayerId) => void;
  /** Accessible group label, e.g. the pack's question. */
  legend: string;
}

/**
 * Phone guess picker: native radio buttons (arrow keys, screen readers and
 * form semantics for free), styled as big chamfered tap targets.
 */
export function NameGrid({ players, selectedId, disabledIds = [], onSelect, legend }: NameGridProps) {
  const name = useId();
  return (
    <fieldset className={styles.grid}>
      <legend className="visually-hidden">{legend}</legend>
      {players.map((p) => (
        <label
          key={p.id}
          className={`chamfer ${styles.cell}`}
          style={{ ['--player' as string]: playerColorVar(p.colorIndex) }}
        >
          <input
            type="radio"
            name={name}
            value={p.id}
            className="visually-hidden"
            checked={p.id === selectedId}
            disabled={disabledIds.includes(p.id)}
            onChange={() => onSelect(p.id)}
          />
          <span className={styles.swatch} aria-hidden="true" />
          {p.name}
        </label>
      ))}
    </fieldset>
  );
}
