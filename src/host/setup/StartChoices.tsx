import { Icon, type IconName } from '../../ui/components/Icon';
import { UI_COPY } from '../../ui/copy';
import styles from './StartChoices.module.css';

const S = UI_COPY.setup;

interface StartChoicesProps {
  onPaste: () => void;
  onOneByOne: () => void;
  /** Absent in host-only mode (nobody joins, so nobody can add their own). */
  onLive?: () => void;
  onSample: () => void;
}

/** Empty setup: three clear ways to start, and a sample game for anyone just looking around. */
export function StartChoices({ onPaste, onOneByOne, onLive, onSample }: StartChoicesProps) {
  const choices: { icon: IconName; copy: { title: string; body: string }; onClick: () => void; featured?: boolean }[] = [
    { icon: 'paste', copy: S.choices.paste, onClick: onPaste, featured: true },
    { icon: 'plus', copy: S.choices.one, onClick: onOneByOne },
    ...(onLive ? [{ icon: 'device' as const, copy: S.choices.live, onClick: onLive }] : []),
  ];
  return (
    <div className={styles.start}>
      <ul className={styles.choices}>
        {choices.map((c) => (
          <li key={c.icon}>
            <button type="button" className={`spot ${styles.choice} ${c.featured ? styles.featured : ''}`} onClick={c.onClick}>
              <span className={styles.icon} aria-hidden="true">
                <Icon name={c.icon} />
              </span>
              <span className={styles.title}>{c.copy.title}</span>
              <span className={styles.body}>{c.copy.body}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-body text-muted">
        {S.sampleLead}{' '}
        <button type="button" className={styles.link} onClick={onSample}>
          {S.sampleLink}
        </button>
      </p>
    </div>
  );
}
