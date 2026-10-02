/**
 * Transport interface. The game never talks to PeerJS (or anything else)
 * directly, so the adapter can be swapped (PartyKit, Supabase Realtime, ...)
 * without touching game code.
 */

export type TransportKind = 'peer' | 'local';

/** One phone's link, as seen by the host. */
export interface Connection {
  readonly id: string;
  send(msg: unknown): void;
  onMessage(cb: (msg: unknown) => void): void;
  onClose(cb: () => void): void;
  close(): void;
}

export interface HostTransport {
  readonly kind: TransportKind;
  onConnection(cb: (conn: Connection) => void): void;
  close(): void;
}

export type ClientStatus = 'connecting' | 'open' | 'reconnecting' | 'not-found' | 'closed';

export interface ClientTransport {
  readonly kind: TransportKind;
  send(msg: unknown): void;
  onMessage(cb: (msg: unknown) => void): void;
  onStatus(cb: (status: ClientStatus) => void): void;
  close(): void;
}

export class RoomTakenError extends Error {
  constructor(code: string) {
    super(`Room ${code} is already hosted somewhere else`);
  }
}

/** Which transport this page should use: `?transport=local` for same-browser demos and tests. */
export function transportKind(): TransportKind {
  return new URLSearchParams(window.location.search).get('transport') === 'local' ? 'local' : 'peer';
}

export async function hostRoom(code: string, kind: TransportKind = transportKind()): Promise<HostTransport> {
  if (kind === 'local') return (await import('./local')).hostLocal(code);
  return (await import('./peer')).hostPeer(code);
}

export async function joinRoom(code: string, kind: TransportKind = transportKind()): Promise<ClientTransport> {
  if (kind === 'local') return (await import('./local')).joinLocal(code);
  return (await import('./peer')).joinPeer(code);
}

/** Tiny typed event list used by the adapters. */
export class Emitter<T> {
  private cbs: ((v: T) => void)[] = [];
  on(cb: (v: T) => void) {
    this.cbs.push(cb);
  }
  emit(v: T) {
    for (const cb of this.cbs) cb(v);
  }
}
