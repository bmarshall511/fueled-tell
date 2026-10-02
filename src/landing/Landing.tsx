import { useId, useState } from 'react';
import { normalizeRoomCode, ROOM_CODE_LENGTH } from '../engine/roomCode';
import { tokens } from '../tokens/tokens';
import { Button } from '../ui/components/Button';
import { UI_COPY } from '../ui/copy';
import { BuiltBy, FueledLockup } from '../ui/components/Logo';
import { useDocumentTitle } from '../ui/hooks/useHostChrome';
import { useInstallPrompt } from '../ui/hooks/useInstallPrompt';
import styles from './Landing.module.css';

const L = UI_COPY.landing;

export default function Landing() {
  const [code, setCode] = useState('');
  const codeId = useId();
  const { canInstall, install } = useInstallPrompt();
  useDocumentTitle(UI_COPY.appName);
  return (
    <main className={styles.landing}>
      <header className={styles.header}>
        <FueledLockup height="36px" />
        <BuiltBy height={`${tokens.size.builtbyPage}px`} />
      </header>

      <section className={styles.hero}>
        <h1 className={styles.title}>{UI_COPY.appName}</h1>
        <p className={styles.tagline}>{UI_COPY.tagline}</p>
        {canInstall && (
          <Button variant="secondary" onClick={install} className={styles.install}>
            {L.install}
          </Button>
        )}
      </section>

      <div className={styles.cards}>
        <a className={`chamfer ${styles.card} ${styles.primary}`} href="/host">
          <span className={styles.cardTitle}>{L.host}</span>
          <span className={styles.cardHint}>{L.hostHint}</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </a>
        <form
          className={`chamfer ${styles.card}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === ROOM_CODE_LENGTH) window.location.assign(`/play?room=${code}`);
          }}
        >
          <label htmlFor={codeId} className={styles.cardTitle}>
            {L.join}
          </label>
          <span className={styles.cardHint}>{L.joinHint}</span>
          <span className={styles.joinRow}>
            <input
              id={codeId}
              className={`chamfer ${styles.code}`}
              value={code}
              onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="K7QF"
            />
            <Button type="submit" disabled={code.length !== ROOM_CODE_LENGTH}>
              {UI_COPY.play.go}
            </Button>
          </span>
        </form>
        <a className={`chamfer ${styles.card}`} href="/demo">
          <span className={styles.cardTitle}>{L.demo}</span>
          <span className={styles.cardHint}>{L.demoHint}</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </a>
      </div>

      <ol className={styles.how}>
        {L.how.map((step, i) => (
          <li key={step} className={styles.step}>
            <span className={styles.stepNum} aria-hidden="true">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </main>
  );
}
