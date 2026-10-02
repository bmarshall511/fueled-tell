import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { MOCK_PACK, MOCK_PLAYERS } from '../mock/data';
import { useMockRound } from '../mock/useMockRound';
import { SCENES, type SceneId } from '../scenes/registry';
import type { SceneModule } from '../scenes/Scene';
import { toSceneProps } from '../scenes/toSceneProps';
import { tokens } from '../tokens/tokens';
import { Button } from '../ui/Button';
import { UI_COPY } from '../ui/copy';
import { GuessTicker } from '../ui/GuessTicker';
import { usePrefersReducedMotion } from '../ui/hooks';
import { BuiltBy, FueledWordmark } from '../ui/Logo';
import { playersById, RevealPanel } from '../ui/RevealPanel';
import { Timer } from '../ui/Timer';
import styles from './Host.module.css';

/** Viewport / 1920x1080 reference stage, exposed to CSS as --stage. */
function useStageScale(): number {
  const compute = () =>
    Math.min(window.innerWidth / tokens.size.stageWidth, window.innerHeight / tokens.size.stageHeight);
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

/** Host keys: Space = next step, L = lock, R = reveal. */
function useHostKeys(handlers: { advance: () => void; lock: () => void; reveal: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement && e.code === 'Space') return; // let the button handle it
      if (e.code === 'Space') {
        e.preventDefault();
        handlers.advance();
      } else if (e.key === 'r' || e.key === 'R') handlers.reveal();
      else if (e.key === 'l' || e.key === 'L') handlers.lock();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}

/** Shared host shell. Each concept only swaps the lazy-loaded scene. */
export default function Host({ sceneId }: { sceneId: SceneId }) {
  // The shell paints immediately; the scene (and Three.js) arrives when its chunk loads.
  const [scene, setScene] = useState<SceneModule | null>(null);
  useEffect(() => {
    let live = true;
    void SCENES[sceneId]().then((m) => live && setScene(m));
    return () => {
      live = false;
    };
  }, [sceneId]);
  const Scene = scene?.default;
  const rendersOwnerName = scene?.rendersOwnerName ?? false;

  const stage = useStageScale();
  const reducedMotion = usePrefersReducedMotion();
  const round = useMockRound();
  const { state, entry, durationMs, expectedGuesses } = round;
  const handlers = useMemo(
    () => ({ advance: round.advance, lock: round.lock, reveal: round.reveal }),
    [round.advance, round.lock, round.reveal],
  );
  useHostKeys(handlers);

  const sceneProps = toSceneProps(state, entry, MOCK_PLAYERS, MOCK_PACK.copy, reducedMotion);
  const owner = MOCK_PLAYERS.find((p) => p.id === sceneProps.reveal?.ownerId);
  const nextLabel = { showing: UI_COPY.next, guessing: UI_COPY.lock, locked: UI_COPY.reveal, reveal: UI_COPY.next }[state.phase];

  return (
    <main className={styles.host} style={{ '--stage': stage } as CSSProperties}>
      {Scene && <Scene {...sceneProps} />}

      <header className={styles.top}>
        <FueledWordmark height={`calc(${tokens.size.tapTarget * 0.6}px * var(--stage))`} />
        <span className={`t-label ${styles.progress}`}>
          {MOCK_PACK.copy.item} {state.index + 1} {UI_COPY.of} {state.order.length}
        </span>
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

      <nav className={styles.controls} aria-label="Host controls">
        <BuiltBy height={`calc(${tokens.size.tapTarget * 0.35}px * var(--stage))`} />
        <Button size="host" variant="secondary" onClick={round.advance} shortcut="Space">
          {nextLabel}
        </Button>
      </nav>
    </main>
  );
}
