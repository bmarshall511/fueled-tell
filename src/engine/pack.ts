import type { Pack } from './types';

/** Minimal runtime check for pack JSON. Phase 1 can tighten this. */
export function asPack(raw: unknown): Pack {
  const p = raw as Partial<Pack>;
  if (!p || typeof p.id !== 'string' || typeof p.name !== 'string' || !p.copy || typeof p.timerSec !== 'number') {
    throw new Error('Invalid pack JSON');
  }
  return p as Pack;
}
