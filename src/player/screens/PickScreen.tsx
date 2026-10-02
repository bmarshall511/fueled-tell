import { useEffect, useState } from 'react';
import { useAck } from '../../ui/hooks/useAck';
import type { PlayerId } from '../../engine/types';
import { NameGrid } from '../../ui/components/NameGrid';
import { GAME } from '../../content';
import { UI_COPY } from '../../ui/copy';
import { Countdown } from '../components/RoundStatus';
import { Heading, PrimaryAction, Split } from '../components/Layout';
import { StoryCard } from '../components/StoryCard';
import { haptics } from '../haptics';
import type { ScreenProps } from './types';

const P = UI_COPY.play;

/** Whose is it? Pick a name and lock it in (picking opens once the host starts guessing). */
export function PickScreen({ view, game, onLocked }: ScreenProps & { onLocked: () => void }) {
  const [pick, setPick] = useState<PlayerId | null>(view.myGuess);
  const open = view.phase === 'guessing';
  // Busy until the host's snapshot carries this guess; then hand over to the waiting screen.
  const lock = useAck(pick !== null && view.myGuess === pick);
  useEffect(() => {
    if (lock.done) onLocked();
  }, [lock.done, onLocked]);
  const question = GAME.copy.question;
  return (
    <Split aside={<StoryCard view={view} itemNoun={GAME.copy.item} />}>
      <Countdown view={view} receivedAt={game.receivedAt} />
      <Heading>{question}</Heading>
      {!open && <p className="text-body text-muted">{P.opensSoon}</p>}
      <NameGrid players={view.players.filter((p) => p.id !== view.me)} selectedId={pick} onSelect={setPick} legend={question} />
      <PrimaryAction
        disabled={!pick || !open}
        busy={lock.busy}
        onClick={() => {
          if (!pick) return;
          haptics.lock();
          lock.start();
          game.guess(pick);
        }}
      >
        {P.lockGuess}
      </PrimaryAction>
    </Split>
  );
}
