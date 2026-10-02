import { GuessProgress } from '../components/RoundStatus';
import { Heading, Split } from '../components/Layout';
import { StoryCard } from '../components/StoryCard';
import type { ScreenProps } from './types';

/** It's your entry: sit tight and watch the guesses come in. */
export function YoursScreen({ view, pack }: Omit<ScreenProps, 'game'>) {
  return (
    <Split aside={<StoryCard view={view} itemNoun={pack.copy.item} />}>
      <Heading accent>{pack.copy.yours}</Heading>
      <GuessProgress view={view} />
    </Split>
  );
}
