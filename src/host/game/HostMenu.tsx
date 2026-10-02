import { forwardRef } from 'react';
import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
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
}

/** The host's menu dialog: sound, full screen, backup, end game. Opened with `ref.current.showModal()`. */
export const HostMenu = forwardRef<HTMLDialogElement, HostMenuProps>(function HostMenu(
  { muted, onToggleMute, fullscreen, onToggleFullscreen, onBackup, finale, onEnd },
  ref,
) {
  const close = (e: { currentTarget: HTMLElement }) => e.currentTarget.closest('dialog')?.close();
  const G = UI_COPY.game;
  return (
    <dialog
      ref={ref}
      className={`chamfer ${styles.menu}`}
      aria-label={UI_COPY.menu}
      // A click on the backdrop (the dialog element itself) closes it.
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
    >
      <h2 className={styles.title}>{UI_COPY.menu}</h2>
      <p className={styles.hint}>{UI_COPY.shortcuts}</p>
      <Button size="host" variant="outline" onClick={onToggleMute} aria-pressed={!muted}>
        {muted ? UI_COPY.soundOff : UI_COPY.soundOn}
      </Button>
      <Button size="host" variant="outline" onClick={onToggleFullscreen} aria-pressed={fullscreen} data-desktop-only>
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
