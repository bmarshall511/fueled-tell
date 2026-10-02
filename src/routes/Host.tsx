import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeAwards, computeStandings } from '../engine/scoring';
import { MOCK_ENTRIES, MOCK_PACK, MOCK_PLAYERS } from '../mock/data';
import { useMockRound } from '../mock/useMockRound';
import { SCENES, type SceneId } from '../scenes/registry';
import type { SceneModule } from '../scenes/Scene';
import { SceneReadyContext } from '../scenes/sceneReady';
import { toSceneProps } from '../scenes/toSceneProps';
import { tokens } from '../tokens/tokens';
import { BootScreen } from '../ui/BootScreen';
import { Button } from '../ui/Button';
import { UI_COPY } from '../ui/copy';
import { Finale } from '../ui/Finale';
import { GuessTicker } from '../ui/GuessTicker';
import { usePrefersReducedMotion } from '../ui/hooks';
import { BuiltBy, FueledWordmark } from '../ui/Logo';
import { playersById, RevealPanel } from '../ui/RevealPanel';
import { stageCssVars, useStageLayout } from '../ui/stage';
import { Timer } from '../ui/Timer';
import { useDocumentTitle, useFullscreen, useWakeLock } from '../ui/useHostChrome';
import styles from './Host.module.css';

interface HostKeys {
  advance: () => void;
  lock: () => void;
  reveal: () => void;
  fullscreen: () => void;
}

/** Host keys: Space = next step, L = lock, R = reveal, F = full screen. */
function useHostKeys(handlers: HostKeys) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('button, a, input, textarea')) {
        if (e.code === 'Space' || e.code === 'Enter') return; // let the focused control handle it
      }
      const key = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        handlers.advance();
      } else if (key === 'r') handlers.reveal();
      else if (key === 'l') handlers.lock();
      else if (key === 'f') handlers.fullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}

/** Shared host shell. Each concept only swaps the lazy-loaded scene. */
export default function Host({ sceneId }: { sceneId: SceneId }) {
  // The shell paints immediately; the scene (and Three.js) arrives when its chunk loads.
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
  const rendersOwnerName = scene?.rendersOwnerName ?? false;

  const layout = useStageLayout();
  const reducedMotion = usePrefersReducedMotion();
  const [fullscreen, toggleFullscreen] = useFullscreen();
  useWakeLock();

  const round = useMockRound();
  const { state, entry, durationMs, expectedGuesses } = round;
  const handlers = useMemo(
    () => ({ advance: round.advance, lock: round.lock, reveal: round.reveal, fullscreen: toggleFullscreen }),
    [round.advance, round.lock, round.reveal, toggleFullscreen],
  );
  useHostKeys(handlers);

  const finale = state.phase === 'finale';
  const sceneProps = toSceneProps(state, entry, MOCK_PLAYERS, MOCK_PACK.copy, reducedMotion);
  const owner = MOCK_PLAYERS.find((p) => p.id === sceneProps.reveal?.ownerId);
  const last = state.index >= state.order.length - 1;
  const nextLabel = {
    showing: UI_COPY.next,
    guessing: UI_COPY.lock,
    locked: UI_COPY.reveal,
    reveal: last ? UI_COPY.finish : UI_COPY.next,
    finale: UI_COPY.playAgain,
  }[state.phase];
  const progress = `${MOCK_PACK.copy.item} ${state.index + 1} ${UI_COPY.of} ${state.order.length}`;

  const standings = useMemo(
    () => (finale ? computeStandings(MOCK_ENTRIES, state.history, MOCK_PLAYERS.map((p) => p.id), MOCK_PACK.points) : []),
    [finale, state.history],
  );
  const awards = useMemo(() => computeAwards(MOCK_ENTRIES, state.history, standings), [state.history, standings]);

  // One polite live region narrates the round for screen-reader users.
  const announcement = (() => {
    switch (state.phase) {
      case 'showing':
        return `${progress}. ${entry.text}`;
      case 'guessing':
        return `${MOCK_PACK.copy.question} Guessing is open.`;
      case 'locked':
        return `Guesses locked. ${state.guesses.length} ${UI_COPY.guesses}.`;
      case 'reveal':
        return owner && sceneProps.reveal
          ? `${MOCK_PACK.copy.reveal} ${owner.name}. ${Math.round(sceneProps.reveal.ratioCorrect * 100)}% ${UI_COPY.guessedRight}.`
          : '';
      case 'finale':
        return '';
    }
  })();
  useDocumentTitle(finale ? `${MOCK_PACK.copy.finale} · ${UI_COPY.appName}` : `${progress} · ${UI_COPY.appName}`);

  const onButton = finale ? () => window.location.assign(window.location.pathname) : round.advance;

  return (
    <main
      className={styles.host}
      style={stageCssVars(layout)}
      data-orientation={layout.orientation}
      aria-busy={!sceneReady && !finale}
    >
      <SceneReadyContext.Provider value={onSceneReady}>{Scene && !finale && <Scene {...sceneProps} />}</SceneReadyContext.Provider>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      {finale ? (
        <Finale standings={standings} awards={awards} players={MOCK_PLAYERS} copy={MOCK_PACK.copy} showScores={MOCK_PACK.scoring !== 'none'} />
      ) : (
        <>
          <header className={styles.top}>
            <FueledWordmark height={`calc(${tokens.size.tapTarget * 0.6}px * var(--stage))`} />
            <span className={`t-label ${styles.progress}`}>{progress}</span>
            <Timer deadline={state.deadline} durationMs={durationMs} />
          </header>

          <footer className={styles.bottom}>
            {state.phase === 'reveal' && owner && sceneProps.reveal ? (
              <RevealPanel
                leadIn={MOCK_PACK.copy.reveal}
                owner={owner}
                ratioCorrect={sceneProps.reveal.ratioCorrect}
                correctPlayers={playersById(MOCK_PLAYERS, sceneProps.reveal.correctPlayerIds)}
                showName={!rendersOwnerName}
                guessedLabel={UI_COPY.guessedRight}
                nobodyLabel={UI_COPY.nobody}
              />
            ) : (
              <>
                <p className={`t-title ${styles.question}`}>{MOCK_PACK.copy.question}</p>
                <GuessTicker received={state.guesses.length} expected={expectedGuesses} label={UI_COPY.guesses} />
              </>
            )}
          </footer>
        </>
      )}

      <nav className={styles.controls} aria-label={UI_COPY.hostControls}>
        <BuiltBy height={`max(${tokens.size.builtbyPage * 0.7}px, calc(${tokens.size.builtbyHost}px * var(--stage)))`} />
        <span className={styles.buttons}>
          <Button
            size="host"
            variant="secondary"
            onClick={toggleFullscreen}
            aria-pressed={fullscreen}
            aria-keyshortcuts="F"
            shortcut="F"
            className={styles.fullscreen}
          >
            {fullscreen ? UI_COPY.exitFullscreen : UI_COPY.fullscreen}
          </Button>
          <Button size="host" variant={finale ? 'primary' : 'secondary'} onClick={onButton} shortcut="Space" aria-keyshortcuts="Space">
            {nextLabel}
          </Button>
        </span>
      </nav>

      <BootScreen ready={sceneReady || finale} />
    </main>
  );
}
