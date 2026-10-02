import { useState } from 'react';
import { tokens } from '../tokens/tokens';
import { Button } from '../ui/Button';
import { UI_COPY } from '../ui/copy';
import { BuiltBy, FueledLockup } from '../ui/Logo';
import { useDocumentTitle } from '../ui/useHostChrome';
import styles from './Demo.module.css';

const D = UI_COPY.demo;

/**
 * The workflow, end to end: the host screen and a phone in two frames, synced
 * over BroadcastChannel (see mock/demoSync.ts). No Three.js in this page itself.
 */
export default function Demo() {
  const [run, setRun] = useState(0);
  useDocumentTitle(`${D.title} · ${UI_COPY.appName}`);
  return (
    <main className={styles.demo}>
      <header className={styles.header}>
        <FueledLockup height="32px" />
        <BuiltBy height={`${tokens.size.builtbyPage}px`} />
      </header>

      <div className={styles.intro}>
        <h1 className={styles.title}>{D.title}</h1>
        <p className={styles.lede}>{D.intro}</p>
      </div>

      <ol className={styles.steps}>
        {D.steps.map((s, i) => (
          <li key={s.what} className={`chamfer ${styles.step}`}>
            <span className={styles.stepNum} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.who}>{s.who}</span>
            <span>{s.what}</span>
          </li>
        ))}
      </ol>

      <div className={styles.bar}>
        <p className={styles.hint}>{D.hint}</p>
        <Button variant="secondary" onClick={() => setRun((n) => n + 1)}>
          {D.restart}
        </Button>
      </div>

      <div className={styles.panes} key={run}>
        <figure className={styles.hostPane}>
          <figcaption className={styles.caption}>{D.host}</figcaption>
          <div className={`chamfer ${styles.hostFrame}`}>
            <iframe title={D.host} src="/create?demo=1" />
          </div>
        </figure>
        <figure className={styles.phonePane}>
          <figcaption className={styles.caption}>{D.phone}</figcaption>
          <div className={`chamfer ${styles.phoneFrame}`}>
            <iframe title={D.phone} src="/play?demo=1" />
          </div>
        </figure>
      </div>
    </main>
  );
}
