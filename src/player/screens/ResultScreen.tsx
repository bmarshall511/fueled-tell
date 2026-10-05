import { useEffect, useRef } from 'react';
import type { PlayerView } from '../../engine/redact';
import { FueledBolt } from '../../ui/components/Logo';
import { PlayerChip } from '../../ui/components/PlayerChip';
import { momentLine } from '../../ui/lib/momentCopy';
import { gameCopy } from '../../content';
import { UI_COPY } from '../../ui/copy';
import { useDrumroll } from '../../ui/hooks/useDrumroll';
import { BigNumber } from '../components/RoundStatus';
import { Heading, Labelled, Split } from '../components/Layout';
import { StoryCard } from '../components/StoryCard';
import { haptics } from '../haptics';
import type { ScreenProps } from './types';
import styles from './ResultScreen.module.css';

const P = UI_COPY.play;

/** The reveal: a drumroll in sync with the shared screen, then the card flips to the owner. */
export function ResultScreen({ view, game }: ScreenProps) {
  const drum = useDrumroll(true, useRevealElapsed(view, game.receivedAt));
  const reveal = view.reveal;
  const owner = view.players.find((p) => p.id === reveal?.ownerId);
  const mine = !!view.item?.mine;
  const right = !!reveal && reveal.correctPlayerIds.includes(view.me);
  useEffect(() => {
    if (drum.done && right) haptics.success();
  }, [drum.done, right]);

  const fooled = view.guessedCount - (reveal?.correctPlayerIds.length ?? 0);
  const moment = momentLine(view.moment, (id) => view.players.find((p) => p.id === id)?.name);
  const headline = mine
    ? `${P.youFooled} ${fooled} ${UI_COPY.of} ${view.guessedCount}`
    : !view.myGuess
      ? P.noGuess
      : right
        ? P.gotIt
        : P.missed;

  return (
    <Split
      aside={
        <div className={`${styles.flip} ${drum.done ? styles.flipped : ''}`}>
          <div className={styles.front}>
            <StoryCard view={view} itemNoun={gameCopy(view.settings).item} />
          </div>
          <div className={`glow-fill ${styles.back}`} aria-hidden={!drum.done}>
            <span className={styles.backLabel}>{P.itWas}</span>
            <span className={styles.owner}>{owner?.name}</span>
          </div>
        </div>
      }
    >
      {drum.count !== null ? (
        <p className={styles.drum} aria-live="off">
          <span className="text-label">{UI_COPY.drumroll}</span>
          <BigNumber>{drum.count}</BigNumber>
        </p>
      ) : (
        <>
          <Heading accent={right || mine}>{headline}</Heading>
          {view.lightning && (
            <p className={styles.lightning}>
              <FueledBolt /> {UI_COPY.eggs.lightning}
            </p>
          )}
          {moment && <p className="text-body text-glow">{moment}</p>}
          {owner && (
            <Labelled label={P.itWas}>
              <PlayerChip player={owner} size="phone" />
            </Labelled>
          )}
        </>
      )}
    </Split>
  );
}

/** How far into this reveal's drumroll we are, pinned to the first snapshot of it (so it never restarts). */
function useRevealElapsed(view: PlayerView, receivedAt: number) {
  const start = useRef<{ id: string; elapsed: number } | null>(null);
  const id = view.item?.id ?? '';
  if (start.current?.id !== id) start.current = { id, elapsed: (view.revealElapsedMs ?? 0) + (Date.now() - receivedAt) };
  return start.current.elapsed;
}
