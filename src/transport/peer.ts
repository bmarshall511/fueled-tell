import Peer, { type DataConnection, type PeerError } from 'peerjs';
import { HEARTBEAT_MS, LINK_TIMEOUT_MS } from './protocol';
import { Emitter, RoomTakenError, type ClientStatus, type ClientTransport, type Connection, type HostTransport } from './Transport';

/**
 * PeerJS adapter (free public broker, no account). The room code maps to the
 * host's peer id, so phones only need the 4-letter code to find the host.
 */
export const peerIdFor = (code: string) => `fueled-tell-${code}`;

/** After a host refresh the broker can hold the old id for a few seconds: retry before giving up. */
const HOST_ID_RETRIES = 6;
const RETRY_MS = 2000;

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

function openPeer(id?: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    const peer = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
    const onError = (err: PeerError<string>) => {
      peer.off('open', onOpen);
      peer.destroy();
      reject(err);
    };
    const onOpen = () => {
      peer.off('error', onError);
      resolve(peer);
    };
    peer.once('open', onOpen);
    peer.once('error', onError);
  });
}

function wrap(dc: DataConnection): Connection {
  const msg = new Emitter<unknown>();
  const close = new Emitter<void>();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    close.emit();
  };
  dc.on('data', (d) => msg.emit(d));
  dc.on('close', finish);
  dc.on('error', finish);
  return {
    id: dc.connectionId,
    send: (data) => {
      if (dc.open) void dc.send(data);
    },
    onMessage: (cb) => msg.on(cb),
    onClose: (cb) => close.on(() => cb()),
    close: () => {
      dc.close();
      finish();
    },
  };
}

export async function hostPeer(code: string): Promise<HostTransport> {
  let peer: Peer | null = null;
  for (let attempt = 0; !peer; attempt++) {
    try {
      peer = await openPeer(peerIdFor(code));
    } catch (err) {
      const type = (err as PeerError<string>).type;
      if (type !== 'unavailable-id') throw err;
      if (attempt >= HOST_ID_RETRIES) throw new RoomTakenError(code);
      await wait(RETRY_MS);
    }
  }
  const host = peer;
  const onConn = new Emitter<Connection>();
  host.on('connection', (dc) => {
    dc.on('open', () => onConn.emit(wrap(dc)));
  });
  // Losing the broker doesn't drop open data connections; just re-register so new phones can find us.
  host.on('disconnected', () => {
    if (!host.destroyed) host.reconnect();
  });
  return { kind: 'peer', onConnection: (cb) => onConn.on(cb), close: () => host.destroy() };
}

export async function joinPeer(code: string): Promise<ClientTransport> {
  const msg = new Emitter<unknown>();
  const status = new Emitter<ClientStatus>();
  let state: ClientStatus = 'connecting';
  let closed = false;
  let peer: Peer | null = null;
  let dc: DataConnection | null = null;
  let lastSeen = Date.now();
  const setStatus = (s: ClientStatus) => {
    if (s !== state) {
      state = s;
      status.emit(s);
    }
  };

  let inFlight = false;
  const connect = async () => {
    // One attempt at a time: the watchdog ticks faster than a failing attempt times out.
    if (closed || inFlight) return;
    inFlight = true;
    try {
      if (!peer || peer.destroyed) peer = await openPeer();
      else if (peer.disconnected) peer.reconnect();
      const p = peer;
      await new Promise<void>((resolve, reject) => {
        const conn = p.connect(peerIdFor(code), { reliable: true });
        const onErr = (err: PeerError<string>) => {
          window.clearTimeout(giveUp);
          reject(err);
        };
        // A connection that never opens (strict NAT, no TURN) must not hang in "connecting" forever.
        const giveUp = window.setTimeout(() => {
          p.off('error', onErr);
          conn.close();
          reject(new Error('timeout'));
        }, LINK_TIMEOUT_MS);
        p.once('error', onErr);
        conn.once('open', () => {
          window.clearTimeout(giveUp);
          p.off('error', onErr);
          dc = conn;
          lastSeen = Date.now();
          setStatus('open');
          conn.on('data', (d) => {
            lastSeen = Date.now();
            msg.emit(d);
          });
          conn.on('close', () => !closed && setStatus('reconnecting'));
          resolve();
        });
      });
    } catch {
      // Couldn't reach the room ("no such room", or no answer in time): report it as not found. A phone that
      // already has a game keeps showing it with a reconnecting note (the host may be refreshing), and the
      // watchdog keeps retrying either way, so a room that opens later still connects.
      setStatus('not-found');
    } finally {
      inFlight = false;
    }
  };

  void connect();
  // Watchdog: reconnect when the link goes quiet or drops (phones sleep, switch networks, etc.).
  const timer = window.setInterval(() => {
    if (closed) return;
    const dead = !dc?.open || Date.now() - lastSeen > LINK_TIMEOUT_MS;
    if (state === 'open' && dead) setStatus('reconnecting');
    if (state !== 'open' && state !== 'connecting') {
      dc?.close();
      dc = null;
      void connect();
    }
  }, HEARTBEAT_MS);
  const onVisible = () => {
    if (document.visibilityState === 'visible' && state !== 'open') void connect();
  };
  document.addEventListener('visibilitychange', onVisible);

  return {
    kind: 'peer',
    send: (data) => {
      if (dc?.open) void dc.send(data);
    },
    onMessage: (cb) => msg.on(cb),
    onStatus: (cb) => status.on(cb),
    close: () => {
      closed = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      dc?.close();
      peer?.destroy();
      setStatus('closed');
    },
  };
}
