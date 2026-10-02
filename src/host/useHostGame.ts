import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGame, expectedGuessers, gameReducer, validateJoin, type GameAction, type RosterRow } from '../engine/game';
import { makeId, seeded } from '../engine/random';
import { redactFor } from '../engine/redact';
import { isRoomCode, makeRoomCode } from '../engine/roomCode';
import { RULES } from '../engine/rules';
import type { GameState, PlayerId, Settings } from '../engine/types';
import { packById } from '../packs';
import { HEARTBEAT_MS, parseClientMsg, type HostMsg } from '../transport/protocol';
import { hostRoom, RoomTakenError, type Connection, type HostTransport } from '../transport/Transport';
import { loadSession, saveSession, type HostSession } from './storage';

export type LinkStatus = 'idle' | 'opening' | 'live' | 'error';

const params = () => new URLSearchParams(window.location.search);

/** Dev/demo only (`?bots=1`): host-imported players guess on their own so a solo test feels like a room. */
const botsEnabled = () => params().has('bots');

/**
 * The host's browser is the server. This hook owns the GameState, persists it,
 * runs the timers, opens the room, and turns phone messages into reducer actions.
 */
export function useHostGame() {
  const [session, setSession] = useState<HostSession | null>(loadSession);
  const [link, setLink] = useState<LinkStatus>('idle');
  const [linkError, setLinkError] = useState<string | null>(null);
  const state = session?.state ?? null;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => saveSession(session), [session]);

  const dispatch = useCallback((action: GameAction) => {
    setSession((s) => (s ? { ...s, state: gameReducer(s.state, action) } : s));
  }, []);

  /** Setup -> lobby. */
  const create = useCallback((packId: string, rows: RosterRow[], settings: Partial<Settings>) => {
    const pack = packById(packId);
    let game = createGame(pack, settings);
    game = gameReducer(game, { type: 'setRoster', rows, ids: rows.map(() => makeId('p')) });
    const forced = params().get('room')?.toUpperCase();
    setSession({ version: 1, roomCode: forced && isRoomCode(forced) ? forced : makeRoomCode(), state: game });
  }, []);

  const end = useCallback(() => setSession(null), []);
  const replace = useCallback((s: HostSession) => setSession(s), []);

  // ---------- Room (transport) ----------
  const conns = useRef(new Map<string, { conn: Connection; playerId: PlayerId | null }>());
  const roomCode = session?.roomCode ?? null;
  const hostOnly = state?.settings.hostOnly ?? false;
  const [connectedCount, setConnectedCount] = useState(0);

  const sendView = useCallback((c: { conn: Connection; playerId: PlayerId | null }, s: GameState) => {
    const pack = packById(s.packId);
    const msg: HostMsg = { type: 'state', view: redactFor(s, c.playerId ?? '', Date.now(), pack.points) };
    c.conn.send(msg);
  }, []);

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
          const entry = { conn, playerId: null as PlayerId | null };
          conns.current.set(conn.id, entry);
          setConnectedCount(conns.current.size);
          conn.onMessage((raw) => {
            const msg = parseClientMsg(raw);
            const s = stateRef.current;
            if (!msg || !s) return;
            if (msg.type === 'hello') {
              const known = s.players.some((p) => p.id === msg.playerId);
              if (!known && !msg.name && !msg.claimId) {
                entry.playerId = msg.playerId; // not joined yet: gets the pre-join view (names to claim)
                return sendView(entry, s);
              }
              const err = validateJoin(s, msg.playerId, msg.name ?? '', msg.claimId);
              if (err) return conn.send({ type: 'error', code: err } satisfies HostMsg);
              entry.playerId = msg.playerId;
              dispatch({ type: 'join', playerId: msg.playerId, name: msg.name ?? '', claimId: msg.claimId });
              return;
            }
            if (!entry.playerId) return;
            if (msg.type === 'submit') dispatch({ type: 'submit', playerId: entry.playerId, text: msg.text });
            if (msg.type === 'guess') dispatch({ type: 'guess', playerId: entry.playerId, entryId: msg.entryId, ownerId: msg.ownerId });
          });
          conn.onClose(() => {
            conns.current.delete(conn.id);
            setConnectedCount(conns.current.size);
            const pid = entry.playerId;
            if (pid && ![...conns.current.values()].some((c) => c.playerId === pid)) dispatch({ type: 'disconnect', playerId: pid });
          });
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLink('error');
        setLinkError(err instanceof RoomTakenError ? 'taken' : 'network');
      });
    const beat = window.setInterval(() => {
      for (const c of conns.current.values()) c.conn.send({ type: 'beat' } satisfies HostMsg);
    }, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(beat);
      transport?.close();
      conns.current.clear();
      setConnectedCount(0);
      setLink('idle');
    };
  }, [roomCode, hostOnly, dispatch, sendView]);

  // Broadcast every change: each phone gets its own redacted snapshot.
  useEffect(() => {
    if (!state) return;
    for (const c of conns.current.values()) if (c.playerId) sendView(c, state);
  }, [state, sendView]);

  /** If the room code is taken (another tab or a stale host), pick a fresh one. */
  const newRoomCode = useCallback(() => setSession((s) => (s ? { ...s, roomCode: makeRoomCode() } : s)), []);

  // ---------- Timers ----------
  const phase = state?.phase;
  const index = state?.index;
  useEffect(() => {
    if (phase !== 'showing') return;
    const id = window.setTimeout(() => dispatch({ type: 'beginGuessing', now: Date.now() }), RULES.showingMs);
    return () => window.clearTimeout(id);
  }, [phase, index, dispatch]);

  const deadline = state?.deadline ?? null;
  useEffect(() => {
    if (phase !== 'guessing' || deadline === null) return;
    const id = window.setTimeout(() => dispatch({ type: 'lock' }), Math.max(0, deadline - Date.now()));
    return () => window.clearTimeout(id);
  }, [phase, deadline, dispatch]);

  const expected = state && phase === 'guessing' ? expectedGuessers(state).length : 0;
  const allIn = !hostOnly && phase === 'guessing' && expected > 0 && (state?.guesses.length ?? 0) >= expected;
  useEffect(() => {
    if (!allIn) return;
    const id = window.setTimeout(() => dispatch({ type: 'lock' }), RULES.autoLockDelayMs);
    return () => window.clearTimeout(id);
  }, [allIn, dispatch]);

  // ---------- Bots (dev/demo) ----------
  useBots(state, dispatch);

  // ---------- Host controls ----------
  const advance = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const now = Date.now();
    switch (s.phase) {
      case 'lobby':
        return dispatch({ type: 'start', seed: now });
      case 'showing':
        return dispatch({ type: 'beginGuessing', now });
      case 'guessing':
        return dispatch({ type: 'lock' });
      case 'locked':
        return dispatch({ type: 'reveal', now });
      case 'reveal':
        return dispatch({ type: 'next' });
      case 'finale':
        return undefined;
    }
  }, [dispatch]);

  const pack = useMemo(() => (state ? packById(state.packId) : null), [state]);

  return {
    session,
    state,
    pack,
    roomCode,
    link,
    linkError,
    connectedCount,
    dispatch,
    create,
    end,
    replace,
    advance,
    newRoomCode,
  };
}

export type HostGame = ReturnType<typeof useHostGame>;

/**
 * Bots claim every host-imported name in the lobby and guess (about half right) during guessing.
 * Effects key on phase/index on purpose: re-running on every state change would reschedule guesses.
 */
function useBots(state: GameState | null, dispatch: (a: GameAction) => void) {
  const on = botsEnabled();
  const phase = state?.phase;
  const unclaimed = state?.players.filter((p) => !p.claimed).length ?? 0;
  useEffect(() => {
    if (!on || !state || phase !== 'lobby' || !unclaimed) return;
    for (const p of state.players.filter((x) => !x.claimed)) dispatch({ type: 'join', playerId: p.id, name: p.name });
  }, [on, phase, unclaimed]);

  const index = state?.index;
  useEffect(() => {
    if (!on || !state || phase !== 'guessing') return;
    const entryId = state.order[state.index];
    const entry = state.entries.find((e) => e.id === entryId);
    if (!entry) return;
    const rand = seeded(state.index * 7919 + 13);
    const botIds = new Set(state.players.filter((p) => p.id.startsWith('p_')).map((p) => p.id));
    const timers = state.players
      .filter((p) => botIds.has(p.id) && p.id !== entry.ownerId)
      .map((p) => {
        const others = state.players.filter((o) => o.id !== p.id && o.id !== entry.ownerId);
        const ownerId = rand() < 0.5 ? entry.ownerId : (others[Math.floor(rand() * others.length)]?.id ?? entry.ownerId);
        return window.setTimeout(
          () => dispatch({ type: 'guess', playerId: p.id, entryId: entry.id, ownerId }),
          (0.1 + rand() * 0.45) * state.settings.timerSec * 1000,
        );
      });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [on, phase, index]);
}
