import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { currentEntry, expectedGuessers, guessersForReveal, isLastEntry } from '../../engine/game';
import { computeStandings, summarizeReveal } from '../../engine/scoring';
import type { PlayerId } from '../../engine/types';
import { pickScene, SCENES } from '../../scenes/registry';
import type { SceneModule } from '../../scenes/Scene';
import { SceneReadyContext } from '../../scenes/sceneReady';
import { toSceneProps } from '../../scenes/toSceneProps';
import { tokens } from '../../tokens/tokens';
import { BootScreen } from './BootScreen';
import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
import { Finale } from './Finale';
import { GuessTicker } from './GuessTicker';
import { usePrefersReducedMotion } from '../../ui/hooks/hooks';
import { BuiltBy, FueledWordmark } from '../../ui/components/Logo';
import { playersById, RevealPanel } from './RevealPanel';
import { isMuted, setMuted, sound, unlock } from '../sound';
import { stageCssVars, useStageLayout } from '../../ui/lib/stage';
import { Timer } from './Timer';
import { useDocumentTitle, useFullscreen, useWakeLock } from '../../ui/hooks/useHostChrome';
import { downloadJson } from '../storage';
import { useDrumroll } from '../../ui/hooks/useDrumroll';
import type { HostGame } from '../useHostGame';
import styles from './GameScreen.module.css';

const G = UI_COPY.game;

/** Host keys: Space = next step, L = lock, R = reveal, M = sound, F = full screen. */
function useHostKeys(handlers: Record<'advance' | 'lock' | 'reveal' | 'mute' | 'fullscreen', () => void>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      unlock();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest('input, textarea, select, dialog')) return;
      if (t?.closest('button, a') && (e.code === 'Space' || e.code === 'Enter')) return; // the focused control handles it
      const key = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        handlers.advance();
      } else if (key === 'r') handlers.reveal();
      else if (key === 'l') handlers.lock();
      else if (key === 'm') handlers.mute();
      else if (key === 'f') handlers.fullscreen();
    };
    const onPointer = () => unlock();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [handlers]);
}

/** Sound cues driven by state changes (so keyboard, buttons and timers all sound the same). */
function useGameSounds(host: HostGame) {
  const s = host.state!;
  const prev = useRef({ phase: s.phase, index: s.index, guesses: s.guesses.length });
  useEffect(() => {
    const p = prev.current;
    if (s.phase === 'showing' && (p.phase !== 'showing' || p.index !== s.index)) window.setTimeout(sound.deal, tokens.duration.base);
    if (s.phase === 'guessing' && s.guesses.length > p.guesses) sound.chip();
    if (s.phase === 'locked' && p.phase === 'guessing') sound.lock();
    if (s.phase === 'finale' && p.phase !== 'finale') sound.fanfare();
    prev.current = { phase: s.phase, index: s.index, guesses: s.guesses.length };
  }, [s.phase, s.index, s.guesses.length]);
}

export function GameScreen({ host }: { host: HostGame }) {
  const s = host.state!;
  const pack = host.pack!;
  const copy = pack.copy;
  const reducedMotion = usePrefersReducedMotion();
  const layout = useStageLayout();
  const [fullscreen, toggleFullscreen] = useFullscreen();
  const [muted, setMutedState] = useState(isMuted);
  const toggleMute = useCallback(() => {
    setMuted(!isMuted());
    setMutedState(isMuted());
  }, []);
  useWakeLock();
  useGameSounds(host);

  // Scene: the 3D Deck, or the flat fallback. The shell paints first; the chunk arrives later.
  const sceneId = useMemo(() => pickScene(reducedMotion), [reducedMotion]);
  const [scene, setScene] = useState<SceneModule | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  useEffect(() => {
    let live = true;
    void SCENES[sceneId]().then((m) => live && setScene(m));
    return () => {
      live = false;
    };
  }, [sceneId]);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const Scene = scene?.default;

  const finale = s.phase === 'finale';
  const reveal = s.phase === 'reveal';
  // Stable per reveal: how far into the drumroll we are when this reveal is first seen (e.g. after a refresh).
  const drumStart = useMemo(() => (s.revealedAt ? Math.max(0, Date.now() - s.revealedAt) : 0), [s.revealedAt]);
  const drum = useDrumroll(reveal, drumStart, true);
  const holdReveal = reveal && !drum.done;
  const sceneProps = toSceneProps(s, copy, reducedMotion, holdReveal);
  const entry = currentEntry(s);
  const summary = reveal && entry ? summarizeReveal(entry, s.guesses, guessersForReveal(s)) : null;
  const owner = s.players.find((p) => p.id === summary?.ownerId);
  const hostOnly = s.settings.hostOnly;

  const lock = useCallback(() => host.dispatch({ type: 'lock' }), [host]);
  const doReveal = useCallback(() => host.dispatch({ type: 'reveal', now: Date.now() }), [host]);
  const handlers = useMemo(
    () => ({ advance: host.advance, lock, reveal: doReveal, mute: toggleMute, fullscreen: toggleFullscreen }),
    [host.advance, lock, doReveal, toggleMute, toggleFullscreen],
  );
  useHostKeys(handlers);

  const standings = useMemo(
    () =>
      finale
        ? computeStandings(
            s.entries.filter((e) => s.order.includes(e.id)),
            s.history,
            s.players.map((p) => p.id),
            pack.points,
          )
        : [],
    [finale, s.entries, s.order, s.history, s.players, pack.points],
  );

  const progress = `${copy.item} ${s.index + 1} ${UI_COPY.of} ${s.order.length}`;
  const nextLabel = {
    lobby: UI_COPY.start,
    showing: UI_COPY.next,
    guessing: UI_COPY.lock,
    locked: UI_COPY.reveal,
    reveal: isLastEntry(s) ? UI_COPY.finish : UI_COPY.next,
    finale: G.restartRound,
  }[s.phase];
  useDocumentTitle(`${finale ? copy.finale : progress} · ${UI_COPY.appName}`);

  // One polite live region narrates the round for screen-reader users.
  const announcement = (() => {
    if (s.phase === 'showing' && entry) return `${progress}. ${entry.text}`;
    if (s.phase === 'guessing') return `${copy.question} ${hostOnly ? G.shout : ''}`;
    if (s.phase === 'locked') return `${UI_COPY.lock}. ${s.guesses.length} ${UI_COPY.guesses}.`;
    if (reveal && drum.done && owner && summary)
      return `${copy.reveal} ${owner.name}. ${Math.round(summary.ratioCorrect * 100)}% ${UI_COPY.guessedRight}.`;
    return '';
  })();

  const toggleTally = (id: PlayerId) => {
    const current = s.guesses.map((g) => g.playerId);
    host.dispatch({ type: 'tally', playerIds: current.includes(id) ? current.filter((x) => x !== id) : [...current, id] });
  };

  const menu = useRef<HTMLDialogElement>(null);

  return (
    <main className={styles.host} style={stageCssVars(layout)} data-orientation={layout.orientation} aria-busy={!sceneReady && !finale}>
      <SceneReadyContext.Provider value={onSceneReady}>
        {Scene && sceneProps && !finale && <Scene {...sceneProps} />}
      </SceneReadyContext.Provider>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      {finale ? (
        <Finale standings={standings} players={s.players} copy={copy} scored={s.settings.scoring === 'competitive'} />
      ) : (
        <>
          <header className={styles.top}>
            <FueledWordmark height={`calc(${tokens.size.tapTarget * 0.6}px * var(--stage))`} />
            <span className={`t-label ${styles.progress}`}>{progress}</span>
            <Timer deadline={s.deadline} durationMs={s.settings.timerSec * 1000} />
          </header>

          <footer className={styles.bottom}>
            {drum.count !== null ? (
              <p className={`t-display ${styles.drumroll}`} aria-hidden="true">
                <span className="t-label">{UI_COPY.drumroll}</span> {drum.count}
              </p>
            ) : reveal && owner && summary ? (
              <RevealPanel
                leadIn={copy.reveal}
                owner={owner}
                ratioCorrect={summary.ratioCorrect}
                correctPlayers={playersById(s.players, summary.correctPlayerIds)}
                showName={!scene?.rendersOwnerName}
                guessedLabel={UI_COPY.guessedRight}
                nobodyLabel={UI_COPY.nobody}
              >
                {hostOnly ? (
                  <fieldset className={styles.tally}>
                    <legend className="visually-hidden">{G.whoGotIt}</legend>
                    {s.players
                      .filter((p) => p.id !== owner.id)
                      .map((p) => (
                        <label key={p.id} className={`chamfer ${styles.tallyChip}`}>
                          <input type="checkbox" checked={s.guesses.some((g) => g.playerId === p.id)} onChange={() => toggleTally(p.id)} />
                          {p.name}
                        </label>
                      ))}
                  </fieldset>
                ) : undefined}
              </RevealPanel>
            ) : (
              <>
                <p className={`t-title ${styles.question}`}>{copy.question}</p>
                {hostOnly ? (
                  <p className={`t-title ${styles.shout}`}>{G.shout}</p>
                ) : (
                  <GuessTicker
                    received={s.guesses.length}
                    expected={Math.max(expectedGuessers(s).length, s.guesses.length)}
                    label={UI_COPY.guesses}
                  />
                )}
              </>
            )}
          </footer>
        </>
      )}

      {!finale && host.link === 'error' && !hostOnly && (
        <p className={`chamfer ${styles.linkLost}`} role="status">
          {G.linkLost}
        </p>
      )}

      <nav className={styles.controls} aria-label={UI_COPY.hostControls}>
        <BuiltBy height={`max(${tokens.size.builtbyPage * 0.7}px, calc(${tokens.size.builtbyHost}px * var(--stage)))`} />
        <span className={styles.buttons}>
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
            className={styles.optional}
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
            className={`${styles.fullscreen} ${styles.optional}`}
          >
            {fullscreen ? UI_COPY.exitFullscreen : UI_COPY.fullscreen}
          </Button>
          <Button
            size="host"
            variant={finale ? 'primary' : 'secondary'}
            onClick={finale ? () => host.dispatch({ type: 'restart' }) : host.advance}
            shortcut={finale ? undefined : 'Space'}
            aria-keyshortcuts={finale ? undefined : 'Space'}
          >
            {nextLabel}
          </Button>
        </span>
      </nav>

      <dialog
        ref={menu}
        className={`chamfer ${styles.menu}`}
        aria-label={UI_COPY.menu}
        onClick={(e) => e.target === menu.current && menu.current?.close()}
      >
        <h2 className={styles.menuTitle}>{UI_COPY.menu}</h2>
        <p className={styles.menuHint}>{UI_COPY.shortcuts}</p>
        <Button size="host" variant="outline" onClick={toggleMute} aria-pressed={!muted}>
          {muted ? UI_COPY.soundOff : UI_COPY.soundOn}
        </Button>
        <Button size="host" variant="outline" onClick={toggleFullscreen} aria-pressed={fullscreen} className={styles.fullscreen}>
          {fullscreen ? UI_COPY.exitFullscreen : UI_COPY.fullscreen}
        </Button>
        <Button size="host" variant="outline" onClick={() => host.session && downloadJson(`tell-${host.roomCode}.json`, host.session)}>
          {G.exportBackup}
        </Button>
        {finale && (
          <Button size="host" variant="outline" onClick={host.end}>
            {G.newGame}
          </Button>
        )}
        {!finale && (
          <Button size="host" variant="outline" onClick={() => window.confirm(G.endConfirm) && host.end()}>
            {G.endGame}
          </Button>
        )}
        <Button size="host" onClick={() => menu.current?.close()}>
          {UI_COPY.close}
        </Button>
      </dialog>

      {!finale && <BootScreen ready={sceneReady} />}
    </main>
  );
}
