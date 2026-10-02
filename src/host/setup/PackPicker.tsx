import { PACKS } from '../../packs';
import { UI_COPY } from '../../ui/copy';
import styles from './PackPicker.module.css';

const S = UI_COPY.setup;

/** One card per pack (native radios): name, prompt, default timer and scoring. */
export function PackPicker({ value, onChange }: { value: string; onChange: (packId: string) => void }) {
  return (
    <div className={styles.packs}>
      {PACKS.map((p) => (
        <label key={p.id} className={styles.pack}>
          <input type="radio" name="pack" className="visually-hidden" checked={p.id === value} onChange={() => onChange(p.id)} />
          <span className={styles.name}>{p.name}</span>
          {/* Muted with opacity, so it works on both the dark and the white (selected) card. */}
          <span className={styles.prompt}>{p.prompt}</span>
          <span className={styles.meta}>
            {p.timerSec}
            {S.seconds} · {S.scoringModes[p.scoring]}
          </span>
        </label>
      ))}
    </div>
  );
}
