import { GAME } from '../../content';
import { GuessProgress } from '../components/RoundStatus';
import { Heading, Split } from '../components/Layout';
import { StoryCard } from '../components/StoryCard';
import type { ScreenProps } from './types';

/** It's your entry: sit tight and watch the guesses come in. */
export function YoursScreen({ view }: Pick<ScreenProps, 'view'>) {
  return (
    <Split aside={<StoryCard view={view} itemNoun={GAME.copy.item} />}>
      <Heading accent>{GAME.copy.yours}</Heading>
      <GuessProgress view={view} />
    </Split>
  );
}
