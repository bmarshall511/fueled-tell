import { useCallback, useEffect, useRef, useState } from 'react';
import type { JoinError } from '../engine/game';
import { makeId } from '../engine/random';
import type { PlayerView } from '../engine/redact';
import { normalizeRoomCode } from '../engine/roomCode';
import type { PlayerId } from '../engine/types';
import { parseHostMsg, type ClientMsg } from '../transport/protocol';
import { joinRoom, type ClientStatus, type ClientTransport } from '../transport/Transport';

interface Identity {
  playerId: PlayerId;
  room: string | null;
  name: string;
}

/** `?seat=2` gives a separate identity per tab (demo / testing several phones in one browser). */
const storageKey = () => `tell:player${new URLSearchParams(window.location.search).get('seat') ?? ''}`;

function loadIdentity(): Identity {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw) as Identity;
  } catch {
    /* fall through */
  }
  return { playerId: makeId('u'), room: null, name: '' };
}

function saveIdentity(id: Identity) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(id));
  } catch {
    /* private mode: rejoin after refresh will need the name again */
  }
}

/**
 * Phone side: connect to a room, keep a stable playerId (so a refresh rejoins
 * as the same player), and turn the host's redacted snapshots into state.
 */
export function usePlayerGame() {
  const [identity, setIdentity] = useState<Identity>(() => {
    const id = loadIdentity();
    const fromUrl = normalizeRoomCode(new URLSearchParams(window.location.search).get('room') ?? '');
    return fromUrl && fromUrl !== id.room ? { ...id, room: fromUrl } : id;
  });
  const [status, setStatus] = useState<ClientStatus | 'idle'>('idle');
  const [view, setView] = useState<PlayerView | null>(null);
  const [error, setError] = useState<JoinError | null>(null);
  /** Local time when the latest snapshot arrived, for countdowns without clock skew. */
  const [receivedAt, setReceivedAt] = useState(0);
  const transport = useRef<ClientTransport | null>(null);
  const identityRef = useRef(identity);
  identityRef.current = identity;

  useEffect(() => saveIdentity(identity), [identity]);

  const send = useCallback((msg: ClientMsg) => transport.current?.send(msg), []);

  const room = identity.room;
  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    let t: ClientTransport | null = null;
    setStatus('connecting');
    setView(null);
    void joinRoom(room).then((tr) => {
      if (cancelled) return tr.close();
      t = tr;
      transport.current = tr;
      const hello = () => {
        const { playerId, name } = identityRef.current;
        tr.send({ type: 'hello', playerId, ...(name ? { name } : {}) } satisfies ClientMsg);
      };
      tr.onStatus((s) => {
        setStatus(s);
        if (s === 'open') hello();
      });
      tr.onMessage((raw) => {
        const msg = parseHostMsg(raw);
        if (!msg) return;
        if (msg.type === 'state') {
          setView(msg.view);
          setReceivedAt(Date.now());
          if (msg.view.players.some((p) => p.id === msg.view.me)) setError(null);
        }
        if (msg.type === 'error') setError(msg.code);
      });
      setStatus('connecting');
      // The local adapter may already be open by now.
      hello();
    });
    return () => {
      cancelled = true;
      t?.close();
      transport.current = null;
    };
  }, [room]);

  const joined = !!view && view.players.some((p) => p.id === identity.playerId);

  const setRoom = useCallback((code: string) => setIdentity((i) => ({ ...i, room: normalizeRoomCode(code) || null })), []);
  const leaveRoom = useCallback(() => {
    setIdentity((i) => ({ ...i, room: null }));
    setStatus('idle');
    setView(null);
  }, []);

  const join = useCallback(
    (name: string, claimId?: PlayerId) => {
      setError(null);
      setIdentity((i) => ({ ...i, name: name.trim() }));
      send({ type: 'hello', playerId: identity.playerId, name: name.trim(), ...(claimId ? { claimId } : {}) });
    },
    [identity.playerId, send],
  );

  const submit = useCallback((text: string) => send({ type: 'submit', text }), [send]);
  const guess = useCallback(
    (ownerId: PlayerId) => {
      if (view?.item) send({ type: 'guess', entryId: view.item.id, ownerId });
    },
    [send, view?.item],
  );

  return { identity, status, view, joined, error, receivedAt, setRoom, leaveRoom, join, submit, guess };
}

export type PlayerGame = ReturnType<typeof usePlayerGame>;
