import { useEffect, useState } from 'react';
import { makeRoomCode } from '../engine/roomCode';
import { sessionKey } from '../host/state/storage';
import { Button } from '../ui/components/Button';
import { UI_COPY } from '../ui/copy';
import { BuiltBy, FueledLockup } from '../ui/components/Logo';
import { useDocumentTitle } from '../ui/hooks/useDocumentTitle';
import styles from './Demo.module.css';

const D = UI_COPY.demo;

/** A fresh room per run, so an old demo tab can never capture the phone. */
const srcs = (room: string) => ({
  host: `/host?transport=local&room=${room}&sample=1&bots=1`,
  phone: `/play?transport=local&room=${room}&seat=demo`,
});

/** Start every demo run fresh: drop the local-demo host session and the demo phone's identity. */
function resetDemo() {
  try {
    localStorage.removeItem(sessionKey(true));
    localStorage.removeItem('tell:playerdemo');
  } catch {
    /* ignore */
  }
}

/**
 * A real game in one browser: the actual /host and /play apps in two frames,
 * talking over the local (BroadcastChannel) transport, with bots for the rest.
 */
export default function Demo() {
  const [run, setRun] = useState(0);
  const [ready, setReady] = useState(false);
  const [room, setRoom] = useState(makeRoomCode);
  useEffect(() => {
    resetDemo();
    setRoom(makeRoomCode());
    setReady(true);
  }, [run]);
  const src = srcs(room);
  useDocumentTitle(D.title);
  return (
    <main className={styles.demo}>
      <header className={styles.header}>
        <FueledLockup size="page" />
        <BuiltBy size="page" />
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
        <Button
          variant="secondary"
          onClick={() => {
            setReady(false);
            setRun((n) => n + 1);
          }}
        >
          {D.restart}
        </Button>
      </div>

      {ready && (
        <div className={styles.panes} key={run}>
          <figure className={styles.hostPane}>
            <figcaption className={styles.caption}>{D.host}</figcaption>
            <div className={`chamfer ${styles.hostFrame}`}>
              <iframe title={D.host} src={src.host} allow="fullscreen; screen-wake-lock" />
            </div>
          </figure>
          <figure className={styles.phonePane}>
            <figcaption className={styles.caption}>{D.phone}</figcaption>
            <div className={`chamfer ${styles.phoneFrame}`}>
              <iframe title={D.phone} src={src.phone} />
            </div>
          </figure>
        </div>
      )}
    </main>
  );
}
