import { HEARTBEAT_MS, LINK_TIMEOUT_MS } from './protocol';
import { Emitter, RoomTakenError, type ClientStatus, type ClientTransport, type Connection, type HostTransport } from './Transport';

/**
 * Same-browser transport over BroadcastChannel: multi-tab dev, the /demo page,
 * and end-to-end tests. Mirrors the PeerJS adapter's behavior (heartbeats,
 * reconnects, room-taken) so the game code can't tell the difference.
 */
type Frame =
  | { k: 'probe'; from: string }
  | { k: 'host-here'; to: string }
  | { k: 'open'; from: string }
  | { k: 'welcome'; to: string }
  | { k: 'msg'; from: string; data: unknown }
  | { k: 'to'; to: string; data: unknown }
  | { k: 'close'; from: string }
  | { k: 'beat'; from: string };

const channelName = (code: string) => `tell:room:${code}`;
const randomId = () => Math.random().toString(36).slice(2, 10);

export async function hostLocal(code: string): Promise<HostTransport> {
  const ch = new BroadcastChannel(channelName(code));
  const me = randomId();
  // Refuse if another tab already hosts this room.
  const taken = await new Promise<boolean>((resolve) => {
    const t = window.setTimeout(() => resolve(false), 400);
    ch.onmessage = (e: MessageEvent<Frame>) => {
      if (e.data.k === 'host-here' && e.data.to === me) {
        window.clearTimeout(t);
        resolve(true);
      }
    };
    ch.postMessage({ k: 'probe', from: me } satisfies Frame);
  });
  if (taken) {
    ch.close();
    throw new RoomTakenError(code);
  }

  const conns = new Map<string, { conn: Connection; msg: Emitter<unknown>; close: Emitter<void>; seen: number }>();
  const onConn = new Emitter<Connection>();
  const drop = (id: string) => {
    const c = conns.get(id);
    if (!c) return;
    conns.delete(id);
    c.close.emit();
  };

  ch.onmessage = (e: MessageEvent<Frame>) => {
    const f = e.data;
    if (f.k === 'probe') return ch.postMessage({ k: 'host-here', to: f.from } satisfies Frame);
    if (f.k === 'open') {
      drop(f.from);
      const msg = new Emitter<unknown>();
      const close = new Emitter<void>();
      const conn: Connection = {
        id: f.from,
        send: (data) => ch.postMessage({ k: 'to', to: f.from, data } satisfies Frame),
        onMessage: (cb) => msg.on(cb),
        onClose: (cb) => close.on(() => cb()),
        close: () => drop(f.from),
      };
      conns.set(f.from, { conn, msg, close, seen: Date.now() });
      ch.postMessage({ k: 'welcome', to: f.from } satisfies Frame);
      onConn.emit(conn);
      return;
    }
    const c = 'from' in f ? conns.get(f.from) : undefined;
    if (!c) return;
    c.seen = Date.now();
    if (f.k === 'msg') c.msg.emit(f.data);
    if (f.k === 'close') drop(f.from);
  };

  const sweep = window.setInterval(() => {
    const now = Date.now();
    for (const [id, c] of conns) if (now - c.seen > LINK_TIMEOUT_MS) drop(id);
  }, HEARTBEAT_MS);

  return {
    kind: 'local',
    onConnection: (cb) => onConn.on(cb),
    close: () => {
      window.clearInterval(sweep);
      [...conns.keys()].forEach(drop);
      ch.close();
    },
  };
}

export async function joinLocal(code: string): Promise<ClientTransport> {
  const ch = new BroadcastChannel(channelName(code));
  const me = randomId();
  const msg = new Emitter<unknown>();
  const status = new Emitter<ClientStatus>();
  let state: ClientStatus = 'connecting';
  let lastSeen = 0;
  let closed = false;
  const setStatus = (s: ClientStatus) => {
    if (s !== state) {
      state = s;
      status.emit(s);
    }
  };

  ch.onmessage = (e: MessageEvent<Frame>) => {
    const f = e.data;
    if (f.k === 'welcome' && f.to === me) {
      lastSeen = Date.now();
      setStatus('open');
    } else if (f.k === 'to' && f.to === me) {
      lastSeen = Date.now();
      if (state !== 'open') setStatus('open');
      msg.emit(f.data);
    }
  };

  const open = () => ch.postMessage({ k: 'open', from: me } satisfies Frame);
  open();
  const timer = window.setInterval(() => {
    if (closed) return;
    ch.postMessage({ k: 'beat', from: me } satisfies Frame);
    if (state === 'open' && Date.now() - lastSeen > LINK_TIMEOUT_MS) setStatus('reconnecting');
    if (state !== 'open') {
      if (state === 'connecting' && lastSeen === 0) setStatus('not-found');
      open();
    }
  }, HEARTBEAT_MS);
  const onHide = () => ch.postMessage({ k: 'close', from: me } satisfies Frame);
  window.addEventListener('pagehide', onHide);

  return {
    kind: 'local',
    send: (data) => ch.postMessage({ k: 'msg', from: me, data } satisfies Frame),
    onMessage: (cb) => msg.on(cb),
    onStatus: (cb) => status.on(cb),
    close: () => {
      closed = true;
      window.clearInterval(timer);
      window.removeEventListener('pagehide', onHide);
      onHide();
      ch.close();
      setStatus('closed');
    },
  };
}
