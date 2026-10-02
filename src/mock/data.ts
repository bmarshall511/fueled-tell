import { asPack } from '../engine/pack';
import type { Entry } from '../engine/types';
import faveShowJson from '../packs/fave-show.json';
import packJson from '../packs/true-story.json';
import twoTruthsJson from '../packs/two-truths.json';
import type { SeatedPlayer } from '../ui/types';
import entriesJson from './entries.json';
import playersJson from './players.json';

export const MOCK_PACK = asPack(packJson);
export const PACKS = [MOCK_PACK, asPack(faveShowJson), asPack(twoTruthsJson)] as const;
export const MOCK_PLAYERS: readonly SeatedPlayer[] = playersJson.map((p, i) => ({ ...p, colorIndex: i }));
export const MOCK_ENTRIES: readonly Entry[] = entriesJson;
export const MOCK_ROOM_CODE = 'K7QF';
