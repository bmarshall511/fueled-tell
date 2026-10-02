import { useEffect, useRef, useState } from 'react';
import { validateJoin, type GameAction } from '../../engine/game';
import { redactFor } from '../../engine/redact';
import type { GameState, PlayerId } from '../../engine/types';
import { GAME } from '../../content';
import { HEARTBEAT_MS, parseClientMsg, type ClientMsg, type HostMsg } from '../../transport/protocol';
import { hostRoom, RoomTakenError, type Connection, type HostTransport } from '../../transport/Transport';

export type LinkStatus = 'idle' | 'opening' | 'live' | 'error';
export type LinkError = 'taken' | 'network';

/** A phone's link, and the player it has joined as (null until it says hello). */
interface Peer {
  conn: Connection;
  playerId: PlayerId | null;
}

const send = (peer: Peer, msg: HostMsg) => peer.conn.send(msg);
const sendView = (peer: Peer, s: GameState) =>
  send(peer, { type: 'state', view: redactFor(s, peer.playerId ?? '', Date.now(), GAME.points) });

/** Turn one phone message into a reducer action (or a direct reply). */
function handleMessage(msg: ClientMsg, peer: Peer, s: GameState, dispatch: (a: GameAction) => void): void {
  if (msg.type === 'hello') {
    const known = s.players.find((p) => p.id === msg.playerId);
    if (known?.key && known.key !== msg.key) return send(peer, { type: 'error', code: 'notYou' });
    if (!known && !msg.name && !msg.claimId) {
      peer.playerId = msg.playerId; // not joined yet: gets the pre-join view (names to claim)
      return sendView(peer, s);
    }
    const err = validateJoin(s, msg.playerId, msg.name ?? '', msg.claimId, msg.key);
    if (err) return send(peer, { type: 'error', code: err });
    peer.playerId = msg.playerId;
    return dispatch({ type: 'join', playerId: msg.playerId, name: msg.name ?? '', claimId: msg.claimId, key: msg.key });
  }
  if (!peer.playerId) return;
  if (msg.type === 'submit') dispatch({ type: 'submit', playerId: peer.playerId, text: msg.text });
  if (msg.type === 'guess') dispatch({ type: 'guess', playerId: peer.playerId, entryId: msg.entryId, ownerId: msg.ownerId });
}

/**
 * Opens the room (unless host-only), routes phone messages into the reducer, and
 * sends each phone its own redacted snapshot after every change.
 */
export function useHostRoom(
  state: GameState | null,
  roomCode: string | null,
  dispatch: (a: GameAction) => void,
  onTaken: () => void,
): { link: LinkStatus; linkError: LinkError | null } {
  const [link, setLink] = useState<LinkStatus>('idle');
  const [linkError, setLinkError] = useState<LinkError | null>(null);
  const peers = useRef(new Map<string, Peer>());
  const stateRef = useRef(state);
  stateRef.current = state;
  const hostOnly = state?.settings.hostOnly ?? false;

  useEffect(() => {
    if (!roomCode || hostOnly) return;
    let transport: HostTransport | null = null;
    let cancelled = false;
    setLink('opening');
    setLinkError(null);
    hostRoom(roomCode)
      .then((t) => {
        if (cancelled) return t.close();
        transport = t;
        setLink('live');
        t.onConnection((conn) => {
          const peer: Peer = { conn, playerId: null };
          peers.current.set(conn.id, peer);
          conn.onMessage((raw) => {
            const msg = parseClientMsg(raw);
            if (msg && stateRef.current) handleMessage(msg, peer, stateRef.current, dispatch);
          });
          conn.onClose(() => {
            peers.current.delete(conn.id);
            const pid = peer.playerId;
            const stillHere = [...peers.current.values()].some((p) => p.playerId === pid);
            if (pid && !stillHere) dispatch({ type: 'disconnect', playerId: pid });
          });
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const taken = err instanceof RoomTakenError;
        setLink('error');
        setLinkError(taken ? 'taken' : 'network');
        if (taken) onTaken();
      });
    const beat = window.setInterval(() => peers.current.forEach((p) => send(p, { type: 'beat' })), HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(beat);
      transport?.close();
      peers.current.clear();
      setLink('idle');
    };
  }, [roomCode, hostOnly, dispatch, onTaken]);

  // Broadcast every change: each phone gets its own redacted snapshot.
  useEffect(() => {
    if (!state) return;
    peers.current.forEach((p) => p.playerId && sendView(p, state));
  }, [state]);

  return { link, linkError };
}
