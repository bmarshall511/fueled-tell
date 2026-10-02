import { useState } from 'react';
import type { PlayerId } from '../../engine/types';
import { NameGrid } from '../../ui/components/NameGrid';
import { UI_COPY } from '../../ui/copy';
import { Countdown } from '../components/RoundStatus';
import { Heading, PrimaryAction, Split } from '../components/Layout';
import { StoryCard } from '../components/StoryCard';
import { haptics } from '../haptics';
import type { ScreenProps } from './types';

const P = UI_COPY.play;

/** Whose is it? Pick a name and lock it in (picking opens once the host starts guessing). */
export function PickScreen({ view, game, pack, onLocked }: ScreenProps & { onLocked: () => void }) {
  const [pick, setPick] = useState<PlayerId | null>(view.myGuess);
  const open = view.phase === 'guessing';
  const question = pack.copy.question;
  return (
    <Split aside={<StoryCard view={view} itemNoun={pack.copy.item} />}>
      <Countdown view={view} receivedAt={game.receivedAt} />
      <Heading>{question}</Heading>
      {!open && <p className="text-body text-muted">{P.opensSoon}</p>}
      <NameGrid players={view.players.filter((p) => p.id !== view.me)} selectedId={pick} onSelect={setPick} legend={question} />
      <PrimaryAction
        disabled={!pick || !open}
        onClick={() => {
          if (!pick) return;
          haptics.lock();
          game.guess(pick);
          onLocked();
        }}
      >
        {P.lockGuess}
      </PrimaryAction>
    </Split>
  );
}
