import type { ReactNode } from 'react';
import { CodeChip } from '../../ui/components/CodeChip';
import { QrCode } from '../../ui/components/qr/QrCode';
import { UI_COPY } from '../../ui/copy';
import { displayUrl, joinUrl } from './joinUrl';
import styles from './JoinPanel.module.css';

const L = UI_COPY.lobby;

/** How players get in: the join link, the big room code, the pack prompt, and a QR code. */
export function JoinPanel({ code, prompt, status }: { code: string; prompt: string; status?: ReactNode }) {
  const url = joinUrl(code);
  const shown = displayUrl(url);
  return (
    <section className={styles.panel}>
      <div className={styles.join}>
        <h1 tabIndex={-1} className={`t-label ${styles.joinAt}`}>
          {L.joinAt} <span className={styles.url}>{shown}</span>
        </h1>
        <CodeChip code={code} size="host" />
        <p className={`t-body ${styles.prompt}`}>{prompt}</p>
        {status}
      </div>
      <figure className={styles.qr}>
        <span className={`chamfer ${styles.qrCode}`}>
          <QrCode value={url} label={`${L.scan}: ${shown}`} />
        </span>
        <figcaption className="t-label">{L.scan}</figcaption>
      </figure>
    </section>
  );
}

/** Host-only games skip joining: a headline and how to play instead. */
export function HostOnlyIntro() {
  return (
    <section className={styles.panel}>
      <div className={styles.join}>
        <h1 className={`t-display ${styles.title}`}>{L.hostOnlyTitle}</h1>
        <p className={`t-body ${styles.prompt}`}>{L.hostOnlyHint}</p>
      </div>
    </section>
  );
}
