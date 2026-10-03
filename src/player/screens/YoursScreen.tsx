import { useEffect, useState } from 'react';
import { GAME } from '../../content';
import { tokens } from '../../tokens/tokens';
import { GuessProgress } from '../components/RoundStatus';
import { Heading, Split } from '../components/Layout';
import { StoryCard } from '../components/StoryCard';
import type { ScreenProps } from './types';
import styles from './YoursScreen.module.css';

/** How long each "act natural" tip stays up. */
const TIP_MS = tokens.duration.entrance * 3;

/** One quiet tip at a time for the owner (on this screen only: no sound, no vibration, nothing on the shared screen). */
function useTip(tips: readonly string[]) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (tips.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % tips.length), TIP_MS);
    return () => window.clearInterval(t);
  }, [tips]);
  return tips[i] ?? null;
}

/** It's your entry: sit tight, act natural, and watch the guesses come in. */
export function YoursScreen({ view }: Pick<ScreenProps, 'view'>) {
  const tip = useTip(GAME.copy.actNatural);
  return (
    <Split aside={<StoryCard view={view} itemNoun={GAME.copy.item} />}>
      <Heading accent>{GAME.copy.yours}</Heading>
      {tip && (
        <p key={tip} className={styles.tip}>
          {tip}
        </p>
      )}
      <GuessProgress view={view} />
    </Split>
  );
}
