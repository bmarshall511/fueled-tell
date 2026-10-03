import { useId, useState } from 'react';
import { normalizeRoomCode, ROOM_CODE_LENGTH } from '../engine/roomCode';
import { tokens } from '../tokens/tokens';
import { announce, flash, useClickCombo } from '../ui/lib/eggs';
import { Backdrop } from '../ui/components/Backdrop';
import { BrandHeader } from '../ui/components/BrandHeader';
import { Button } from '../ui/components/Button';
import { TextInput } from '../ui/components/TextField';
import { UI_COPY } from '../ui/copy';
import { useDocumentTitle } from '../ui/hooks/useDocumentTitle';
import { useInstallPrompt } from '../ui/hooks/useInstallPrompt';
import styles from './Landing.module.css';

const L = UI_COPY.landing;
const CHARGE_CLICKS = 5;

export default function Landing() {
  const [code, setCode] = useState('');
  const codeId = useId();
  const { canInstall, install } = useInstallPrompt();
  useDocumentTitle();
  const chargeClick = useClickCombo(CHARGE_CLICKS, tokens.duration.entrance * 2, () => {
    flash('charge', tokens.duration.reveal);
    announce(UI_COPY.eggs.charged);
  });
  return (
    <main className={`page ${styles.landing}`}>
      <Backdrop />
      {/* Easter egg: click the Fueled mark five times quickly to charge the glow. */}
      <div onClick={chargeClick}>
        <BrandHeader />
      </div>

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
        <a className={`spot ${styles.card} ${styles.primary}`} href="/host">
          <span className={styles.cardTitle}>{L.host}</span>
          <span className={`text-body ${styles.cardHint}`}>{L.hostHint}</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </a>
        <form
          className={`spot ${styles.card}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === ROOM_CODE_LENGTH) window.location.assign(`/play?room=${code}`);
          }}
        >
          <label htmlFor={codeId} className={styles.cardTitle}>
            {L.join}
          </label>
          <span className={`text-body ${styles.cardHint}`}>{L.joinHint}</span>
          <span className={styles.joinRow}>
            <TextInput
              id={codeId}
              fieldSize="code"
              tone="sunken"
              value={code}
              onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder={UI_COPY.codePlaceholder}
            />
            <Button type="submit" disabled={code.length !== ROOM_CODE_LENGTH}>
              {UI_COPY.play.go}
            </Button>
          </span>
        </form>
        <a className={`spot ${styles.card}`} href="/demo">
          <span className={styles.cardTitle}>{L.demo}</span>
          <span className={`text-body ${styles.cardHint}`}>{L.demoHint}</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </a>
      </div>

      <ol className={styles.how}>
        {L.how.map((step, i) => (
          <li key={step} className={styles.step}>
            <span className={`text-glow ${styles.stepNum}`} aria-hidden="true">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </main>
  );
}
