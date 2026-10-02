import { asPack } from '../engine/pack';
import type { Pack } from '../engine/types';
import faveShow from './fave-show.json';
import trueStory from './true-story.json';
import twoTruths from './two-truths.json';

/** All packs, in picker order. Add a pack: drop a JSON file here and list it. */
export const PACKS: readonly Pack[] = [asPack(trueStory), asPack(faveShow), asPack(twoTruths)];

export const packById = (id: string): Pack => PACKS.find((p) => p.id === id) ?? (PACKS[0] as Pack);
