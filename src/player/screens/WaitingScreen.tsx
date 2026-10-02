import { Button } from '../../ui/components/Button';
import { PlayerChip } from '../../ui/components/PlayerChip';
import { GAME } from '../../content';
import { UI_COPY } from '../../ui/copy';
import { GuessProgress } from '../components/RoundStatus';
import { Heading, Labelled, Pulse, Split } from '../components/Layout';
import { StoryCard } from '../components/StoryCard';
import type { ScreenProps } from './types';

const P = UI_COPY.play;

/** Guess locked: wait for everyone (and change your mind while guessing is open). */
export function WaitingScreen({ view, onChange }: Pick<ScreenProps, 'view'> & { onChange: () => void }) {
  const picked = view.players.find((p) => p.id === view.myGuess);
  return (
    <Split aside={<StoryCard view={view} itemNoun={GAME.copy.item} compact />}>
      <Pulse />
      <Heading>{view.phase === 'locked' ? P.locked : GAME.copy.waiting}</Heading>
      {picked && (
        <Labelled label={P.yourGuess}>
          <PlayerChip player={picked} size="phone" />
        </Labelled>
      )}
      <GuessProgress view={view} />
      {view.phase === 'guessing' && (
        <Button variant="secondary" onClick={onChange}>
          {P.changeGuess}
        </Button>
      )}
    </Split>
  );
}
