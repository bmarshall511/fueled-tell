import type { Player, PlayerId } from '../../engine/types';
import { UI_COPY } from '../../ui/copy';
import styles from './HostTally.module.css';

interface HostTallyProps {
  players: readonly Player[];
  correctIds: readonly PlayerId[];
  onToggle: (id: PlayerId) => void;
}

/** Host-only mode: tick everyone who guessed right (the host heard them shout). */
export function HostTally({ players, correctIds, onToggle }: HostTallyProps) {
  return (
    <fieldset className={styles.tally}>
      <legend className="visually-hidden">{UI_COPY.game.whoGotIt}</legend>
      {players.map((p) => (
        <label key={p.id} className={styles.chip}>
          <input type="checkbox" checked={correctIds.includes(p.id)} onChange={() => onToggle(p.id)} />
          {p.name}
        </label>
      ))}
    </fieldset>
  );
}
