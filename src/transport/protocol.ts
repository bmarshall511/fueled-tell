import type { JoinError } from '../engine/game';
import type { PlayerView } from '../engine/redact';
import type { EntryId, PlayerId } from '../engine/types';

/** Phone -> host. */
export type ClientMsg =
  /** Sent on every (re)connect. With a name (or claimId) it's a join request. */
  | { type: 'hello'; playerId: PlayerId; name?: string; claimId?: PlayerId; key?: string }
  | { type: 'submit'; text: string }
  | { type: 'guess'; entryId: EntryId; ownerId: PlayerId };

/** Host -> phone. The host sends the whole redacted view on every change (simpler than diffs; it's tiny). */
export type HostMsg =
  | { type: 'state'; view: PlayerView }
  | { type: 'error'; code: JoinError }
  /** Liveness ping so phones notice a vanished host quickly. */
  | { type: 'beat' };

export const HEARTBEAT_MS = 3000;
/** No message from the other side for this long means the link is dead. */
export const LINK_TIMEOUT_MS = 10_000;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Minimal runtime guards: never trust what arrives over the wire. */
export function parseClientMsg(v: unknown): ClientMsg | null {
  if (!isObj(v) || typeof v.type !== 'string') return null;
  if (v.type === 'hello' && typeof v.playerId === 'string' && v.playerId.length <= 64) {
    return {
      type: 'hello',
      playerId: v.playerId,
      name: typeof v.name === 'string' ? v.name.slice(0, 64) : undefined,
      claimId: typeof v.claimId === 'string' ? v.claimId : undefined,
      key: typeof v.key === 'string' ? v.key.slice(0, 64) : undefined,
    };
  }
  if (v.type === 'submit' && typeof v.text === 'string') return { type: 'submit', text: v.text.slice(0, 2000) };
  if (v.type === 'guess' && typeof v.entryId === 'string' && typeof v.ownerId === 'string') {
    return { type: 'guess', entryId: v.entryId, ownerId: v.ownerId };
  }
  return null;
}

export function parseHostMsg(v: unknown): HostMsg | null {
  if (!isObj(v) || typeof v.type !== 'string') return null;
  if (v.type === 'state' && isObj(v.view)) return { type: 'state', view: v.view as unknown as PlayerView };
  if (v.type === 'error' && typeof v.code === 'string') return { type: 'error', code: v.code as JoinError };
  if (v.type === 'beat') return { type: 'beat' };
  return null;
}
