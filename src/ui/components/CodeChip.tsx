import styles from './CodeChip.module.css';

/** Room code, one chamfered tile per character. */
export function CodeChip({ code, size = 'phone' }: { code: string; size?: 'host' | 'phone' }) {
  return (
    <span className={`${styles.code} ${styles[size]}`} role="img" aria-label={`Room code ${code.split('').join(' ')}`}>
      {code.split('').map((ch, i) => (
        <span key={i} className={`chamfer-all ${styles.tile}`} aria-hidden="true">
          {ch}
        </span>
      ))}
    </span>
  );
}
