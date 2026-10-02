import { useCallback, useMemo, useRef } from 'react';
import { currentEntry, guessersForReveal, isLastEntry } from '../../engine/game';
import { computeStandings, summarizeReveal } from '../../engine/scoring';
import type { PlayerId } from '../../engine/types';
import { SceneReadyContext } from '../../scenes/sceneReady';
import { toSceneProps } from '../../scenes/toSceneProps';
import { Button } from '../../ui/components/Button';
import { Notice } from '../../ui/components/Notice';
import { UI_COPY } from '../../ui/copy';
import { useDocumentTitle } from '../../ui/hooks/useDocumentTitle';
import { useDrumroll } from '../../ui/hooks/useDrumroll';
import { useFullscreen } from '../../ui/hooks/useFullscreen';
import { useKeyboardShortcuts } from '../../ui/hooks/useKeyboardShortcuts';
import { usePrefersReducedMotion } from '../../ui/hooks/usePrefersReducedMotion';
import { useWakeLock } from '../../ui/hooks/useWakeLock';
import { HostControls } from '../components/HostControls';
import { HostStage } from '../components/HostStage';
import { DRUMROLL_SOUNDS, unlock } from '../sound';
import { downloadJson } from '../state/storage';
import { useMuted } from '../useMuted';
import type { HostGame } from '../state/useHostGame';
import { BootScreen } from './BootScreen';
import { describeRound } from './describeRound';
import { Finale } from './Finale';
import { HostMenu } from './HostMenu';
import { RoundFooter } from './RoundFooter';
import { RoundHeader } from './RoundHeader';
import { useGameSounds } from './useGameSounds';
import { useScene } from './useScene';
import styles from './GameScreen.module.css';

/** The shared screen from the first entry to the finale. */
export function GameScreen({ host }: { host: HostGame }) {
  const s = host.state!;
  const copy = host.pack!.copy;
  const reducedMotion = usePrefersReducedMotion();
  const [fullscreen, toggleFullscreen] = useFullscreen();
  const [muted, toggleMute] = useMuted();
  const scene = useScene(reducedMotion);
  const menu = useRef<HTMLDialogElement>(null);
  useWakeLock();
  useGameSounds(s);

  const finale = s.phase === 'finale';
  const reveal = s.phase === 'reveal';
  // Stable per reveal: how far into the drumroll we are when this reveal is first seen (e.g. after a refresh).
  const drumStart = useMemo(() => (s.revealedAt ? Math.max(0, Date.now() - s.revealedAt) : 0), [s.revealedAt]);
  const drum = useDrumroll(reveal, drumStart, DRUMROLL_SOUNDS);

  const entry = currentEntry(s);
  const summary = reveal && drum.done && entry ? summarizeReveal(entry, s.guesses, guessersForReveal(s)) : null;
  const owner = s.players.find((p) => p.id === summary?.ownerId);
  const revealed = summary && owner ? { owner, summary } : null;
  const sceneProps = toSceneProps(s, copy, reducedMotion, reveal && !drum.done);
  const progress = `${copy.item} ${s.index + 1} ${UI_COPY.of} ${s.order.length}`;
  useDocumentTitle(finale ? copy.finale : progress);

  const joinCode = s.settings.hostOnly ? null : host.roomCode;

  const lock = useCallback(() => host.dispatch({ type: 'lock' }), [host]);
  const doReveal = useCallback(() => host.dispatch({ type: 'reveal', now: Date.now() }), [host]);
  useKeyboardShortcuts({ Space: host.advance, l: lock, r: doReveal, m: toggleMute, f: toggleFullscreen }, unlock);

  const toggleTally = (id: PlayerId) => {
    const ids = s.guesses.map((g) => g.playerId);
    host.dispatch({ type: 'tally', playerIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
  };

  const standings = useMemo(
    () =>
      finale
        ? computeStandings(
            s.entries.filter((e) => s.order.includes(e.id)),
            s.history,
            s.players.map((p) => p.id),
            host.pack?.points,
          )
        : [],
    [finale, s.entries, s.order, s.history, s.players, host.pack?.points],
  );

  const nextLabel = {
    lobby: UI_COPY.start,
    showing: UI_COPY.next,
    guessing: UI_COPY.lock,
    locked: UI_COPY.reveal,
    reveal: isLastEntry(s) ? UI_COPY.finish : UI_COPY.next,
    finale: UI_COPY.game.restartRound,
  }[s.phase];

  return (
    <HostStage className={`${styles.screen} ${finale ? styles.ended : ''}`} busy={!scene.ready && !finale}>
      <SceneReadyContext.Provider value={scene.onReady}>
        {scene.Scene && sceneProps && !finale && <scene.Scene {...sceneProps} />}
      </SceneReadyContext.Provider>

      <p className="visually-hidden" aria-live="polite">
        {describeRound({ state: s, copy, progress, entry, revealed })}
      </p>

      {finale ? (
        <Finale standings={standings} players={s.players} copy={copy} scored={s.settings.scoring === 'competitive'} />
      ) : (
        <div className={`${styles.hud} ${styles.top}`}>
          <RoundHeader progress={progress} deadline={s.deadline} durationMs={s.settings.timerSec * 1000} />
        </div>
      )}

      {!finale && host.link === 'error' && !s.settings.hostOnly && (
        <Notice role="status" className={styles.linkLost}>
          {UI_COPY.game.linkLost}
        </Notice>
      )}

      {/* Round info sits above the controls in normal flow, so they can never overlap. */}
      <div className={`${styles.hud} ${styles.dock}`}>
        {!finale && (
          <footer className={styles.bottom}>
            <RoundFooter
              state={s}
              copy={copy}
              drumroll={drum.count}
              revealed={revealed}
              sceneShowsOwner={scene.rendersOwnerName}
              onToggleTally={toggleTally}
            />
          </footer>
        )}
        <HostControls roomCode={joinCode}>
          <Button size="host" variant="secondary" onClick={() => menu.current?.showModal()} aria-haspopup="dialog">
            {UI_COPY.menu}
          </Button>
          <Button
            size="host"
            variant="secondary"
            onClick={toggleMute}
            aria-pressed={!muted}
            aria-keyshortcuts="M"
            shortcut="M"
            data-optional
          >
            {muted ? UI_COPY.soundOff : UI_COPY.soundOn}
          </Button>
          <Button
            size="host"
            variant="secondary"
            onClick={toggleFullscreen}
            aria-pressed={fullscreen}
            aria-keyshortcuts="F"
            shortcut="F"
            data-optional
            data-desktop-only
          >
            {fullscreen ? UI_COPY.exitFullscreen : UI_COPY.fullscreen}
          </Button>
          {finale ? (
            <Button size="host" onClick={() => host.dispatch({ type: 'restart' })}>
              {nextLabel}
            </Button>
          ) : (
            <Button size="host" variant="secondary" onClick={host.advance} shortcut="Space" aria-keyshortcuts="Space">
              {nextLabel}
            </Button>
          )}
        </HostControls>
      </div>

      <HostMenu
        ref={menu}
        muted={muted}
        onToggleMute={toggleMute}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
        onBackup={() => host.session && downloadJson(`tell-${host.roomCode}.json`, host.session)}
        finale={finale}
        onEnd={host.end}
        roomCode={joinCode}
      />

      {!finale && <BootScreen ready={scene.ready} />}
    </HostStage>
  );
}
