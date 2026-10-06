import { forwardRef, Fragment } from 'react';
import { Button } from '../../ui/components/Button';
import { CodeChip } from '../../ui/components/CodeChip';
import { QrCode } from '../../ui/components/qr/QrCode';
import { UI_COPY } from '../../ui/copy';
import { displayUrl, joinUrl } from '../joinUrl';
import styles from './HostMenu.module.css';

interface HostMenuProps {
  muted: boolean;
  onToggleMute: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onBackup: () => void;
  /** End the game (asks first) or, after the finale, start a new one. */
  finale: boolean;
  onEnd: () => void;
  /** The room to show for latecomers (null in host-only games). */
  roomCode?: string | null;
}

/** The host's menu dialog: sound, full screen, backup, end game. Opened with `ref.current.showModal()`. */
export const HostMenu = forwardRef<HTMLDialogElement, HostMenuProps>(function HostMenu(
  { muted, onToggleMute, fullscreen, onToggleFullscreen, onBackup, finale, onEnd, roomCode },
  ref,
) {
  const close = (e: { currentTarget: HTMLElement }) => e.currentTarget.closest('dialog')?.close();
  const G = UI_COPY.game;
  return (
    <dialog
      ref={ref}
      className={styles.menu}
      aria-label={UI_COPY.menu}
      // A click on the backdrop (the dialog element itself) closes it.
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
    >
      <h2 className={styles.title}>{UI_COPY.menu}</h2>
      <p className={styles.hint}>
        {/* Each pair stays whole; the line breaks only at the separators between them. */}
        {UI_COPY.shortcuts.map((pair, i) => (
          <Fragment key={pair}>
            {i > 0 && ' · '}
            <span className={styles.pair}>{pair}</span>
          </Fragment>
        ))}
      </p>
      {roomCode && <JoinInfo code={roomCode} />}
      <Button size="host" variant="outline" onClick={onToggleMute}>
        {muted ? UI_COPY.soundOn : UI_COPY.soundOff}
      </Button>
      <Button size="host" variant="outline" onClick={onToggleFullscreen} data-desktop-only>
        {fullscreen ? UI_COPY.exitFullscreen : UI_COPY.fullscreen}
      </Button>
      <Button size="host" variant="outline" onClick={onBackup}>
        {G.exportBackup}
      </Button>
      <Button size="host" variant="outline" onClick={() => (finale || window.confirm(G.endConfirm)) && onEnd()}>
        {finale ? G.newGame : G.endGame}
      </Button>
      <Button size="host" onClick={close}>
        {UI_COPY.close}
      </Button>
    </dialog>
  );
});

/** The room code, link and QR, so someone who missed the lobby can still join. */
function JoinInfo({ code }: { code: string }) {
  const url = joinUrl(code);
  const shown = displayUrl(url);
  return (
    <section className={styles.join} aria-label={UI_COPY.roomCode}>
      <span className={styles.qr}>
        <QrCode value={url} label={`${UI_COPY.lobby.scan}: ${shown}`} />
      </span>
      <span className={styles.joinText}>
        <span className={styles.hint}>
          {UI_COPY.lobby.joinAt} <span className={styles.url}>{shown}</span>
        </span>
        <CodeChip code={code} />
      </span>
    </section>
  );
}
