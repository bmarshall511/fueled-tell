import type { RoundMoment } from '../../engine/moments';
import { UI_COPY } from '../copy';

const E = UI_COPY.eggs;

/** The line a round moment shows on the host and phones (null when there's no moment). */
export function momentLine(moment: RoundMoment | null, nameOf: (id: string) => string | undefined): string | null {
  if (!moment) return null;
  if (moment.kind === 'mindMeld') return E.mindMeld;
  if (moment.kind === 'disguise') return E.disguise;
  return `${E.herdBefore}${nameOf(moment.suspectId) ?? ''}${E.herdAfter}`;
}
