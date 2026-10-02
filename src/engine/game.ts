import { RULES } from './rules';
import { seeded, shuffle } from './random';
import type { Entry, EntryId, GameState, Guess, Pack, Player, PlayerId, Settings } from './types';

export interface RosterRow {
  name: string;
  text: string;
}

export type GameAction =
  /** A phone joins (or re-joins) as `playerId`; may claim a host-imported name. */
  | { type: 'join'; playerId: PlayerId; name: string; claimId?: PlayerId; key?: string }
  | { type: 'disconnect'; playerId: PlayerId }
  /** Live intake: a player submits (or replaces) their entry from the lobby. */
  | { type: 'submit'; playerId: PlayerId; text: string }
  /** Host import: replaces all host-imported players and entries. */
  | { type: 'setRoster'; rows: RosterRow[]; ids: string[] }
  | { type: 'removePlayer'; playerId: PlayerId }
  | { type: 'updateSettings'; settings: Partial<Settings> }
  | { type: 'start'; seed: number }
  | { type: 'beginGuessing'; now: number }
  | { type: 'guess'; playerId: PlayerId; entryId: EntryId; ownerId: PlayerId }
  /** Host-only mode: who got the current entry right. */
  | { type: 'tally'; playerIds: PlayerId[] }
  | { type: 'lock' }
  | { type: 'reveal'; now: number }
  | { type: 'next' }
  /** Back to the lobby with the same players and entries. */
  | { type: 'restart' };

export function createGame(pack: Pack, settings: Partial<Settings> = {}): GameState {
  return {
    phase: 'lobby',
    packId: pack.id,
    settings: {
      timerSec: pack.timerSec,
      scoring: pack.scoring,
      hostOnly: false,
      intake: 'host',
      maxLength: pack.entry.maxLength,
      ...settings,
    },
    players: [],
    entries: [],
    order: [],
    index: 0,
    guesses: [],
    history: {},
    deadline: null,
    revealedAt: null,
  };
}

// ---------- Selectors ----------

export const currentEntry = (s: GameState): Entry | undefined => s.entries.find((e) => e.id === s.order[s.index]);

export const isLastEntry = (s: GameState): boolean => s.index >= s.order.length - 1;

export const playerById = (s: GameState, id: PlayerId | null | undefined): Player | undefined => s.players.find((p) => p.id === id);

/** Entries whose owner is still in the game. */
export const playableEntries = (s: GameState): Entry[] => s.entries.filter((e) => s.players.some((p) => p.id === e.ownerId));

export const canStart = (s: GameState): boolean => s.phase === 'lobby' && playableEntries(s).length >= RULES.minEntries;

/** Players expected to guess the current entry: everyone connected except the owner. */
export function expectedGuessers(s: GameState): Player[] {
  const owner = currentEntry(s)?.ownerId;
  return s.players.filter((p) => p.connected && p.id !== owner);
}

export const normalizeName = (name: string): string => name.trim().replace(/\s+/g, ' ').slice(0, RULES.maxNameLength);
const sameName = (a: string, b: string) => normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase();

export type JoinError = 'nameRequired' | 'nameTaken' | 'notYou';

/** Validate a join before dispatching it (so the host can tell the phone why). */
export function validateJoin(s: GameState, playerId: PlayerId, name: string, claimId?: PlayerId, key?: string): JoinError | null {
  const existing = s.players.find((p) => p.id === playerId);
  if (existing) return existing.key && existing.key !== key ? 'notYou' : null; // re-join needs the same phone
  const claim = playerById(s, claimId);
  if (claim && !claim.claimed) return null;
  if (!normalizeName(name)) return 'nameRequired';
  const clash = s.players.find((p) => sameName(p.name, name));
  if (clash?.claimed) return 'nameTaken';
  return null;
}

/** Everyone who could have guessed the current entry (host-only mode: every player but the owner). */
export function guessersForReveal(s: GameState): number {
  const owner = currentEntry(s)?.ownerId;
  return s.settings.hostOnly ? s.players.filter((p) => p.id !== owner).length : s.guesses.length;
}

/** Players are only "connected" while a phone is attached: after a host reload, nobody is until they reconnect. */
export const markAllDisconnected = (s: GameState): GameState => ({ ...s, players: s.players.map((p) => ({ ...p, connected: false })) });

/** The host's one-button "next step" (Space): what it does in each phase. Null in the finale. */
export function nextStep(s: GameState, now: number, seed: number = now): GameAction | null {
  switch (s.phase) {
    case 'lobby':
      return { type: 'start', seed };
    case 'showing':
      return { type: 'beginGuessing', now };
    case 'guessing':
      return { type: 'lock' };
    case 'locked':
      return { type: 'reveal', now };
    case 'reveal':
      return { type: 'next' };
    case 'finale':
      return null;
  }
}

// ---------- Reducer ----------

function nextColor(players: readonly Player[]): number {
  return players.reduce((max, p) => Math.max(max, p.colorIndex), -1) + 1;
}

/** Re-key a player everywhere (used when a phone claims a host-imported name). */
function rekey(s: GameState, from: PlayerId, to: PlayerId): GameState {
  const swap = (id: PlayerId) => (id === from ? to : id);
  const swapGuess = (g: Guess): Guess => ({ ...g, playerId: swap(g.playerId), ownerId: swap(g.ownerId) });
  return {
    ...s,
    players: s.players.map((p) => (p.id === from ? { ...p, id: to } : p)),
    entries: s.entries.map((e) => ({ ...e, ownerId: swap(e.ownerId) })),
    guesses: s.guesses.map(swapGuess),
    history: Object.fromEntries(Object.entries(s.history).map(([k, gs]) => [k, gs.map(swapGuess)])),
  };
}

function setPlayer(s: GameState, id: PlayerId, patch: Partial<Player>): GameState {
  return { ...s, players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

/**
 * Pure game reducer:
 * lobby -> showing -> guessing -> locked -> reveal -> (next) showing ... -> finale -> (restart) lobby.
 * Invalid actions for the current phase return the same state object.
 */
export function gameReducer(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'join': {
      if (validateJoin(s, a.playerId, a.name, a.claimId, a.key)) return s;
      const existing = playerById(s, a.playerId);
      if (existing) return setPlayer(s, a.playerId, { connected: true, claimed: true, ...(a.key && !existing.key ? { key: a.key } : {}) });
      const claim = playerById(s, a.claimId) ?? s.players.find((p) => !p.claimed && sameName(p.name, a.name));
      if (claim && !claim.claimed) {
        return setPlayer(rekey(s, claim.id, a.playerId), a.playerId, { connected: true, claimed: true, ...(a.key ? { key: a.key } : {}) });
      }
      const player: Player = {
        id: a.playerId,
        name: normalizeName(a.name),
        colorIndex: nextColor(s.players),
        connected: true,
        claimed: true,
        ...(a.key ? { key: a.key } : {}),
      };
      return { ...s, players: [...s.players, player] };
    }

    case 'disconnect':
      return playerById(s, a.playerId) ? setPlayer(s, a.playerId, { connected: false }) : s;

    case 'submit': {
      if (s.phase !== 'lobby' || s.settings.intake !== 'live' || !playerById(s, a.playerId)) return s;
      const text = a.text.trim();
      if (!text || text.length > s.settings.maxLength) return s;
      const others = s.entries.filter((e) => e.ownerId !== a.playerId);
      return { ...s, entries: [...others, { id: `e_${a.playerId}`, ownerId: a.playerId, text }] };
    }

    case 'setRoster': {
      if (s.phase !== 'lobby') return s;
      // Phones that joined on their own stay; every host-imported (unclaimed) name is replaced by the rows.
      const players: Player[] = s.players.filter((p) => p.claimed);
      const byOwner = new Map<PlayerId, Entry>();
      // Live submissions survive only for people the rows don't mention (the rows win: they're what the host just saved).
      const rowNames = new Set(a.rows.map((r) => normalizeName(r.name).toLowerCase()));
      for (const e of s.entries) {
        const owner = players.find((p) => p.id === e.ownerId);
        if (owner && s.settings.intake === 'live' && !rowNames.has(owner.name.toLowerCase())) byOwner.set(owner.id, e);
      }
      a.rows.forEach((row, i) => {
        const id = a.ids[i] ?? `p_import_${i}`;
        const match = players.find((p) => sameName(p.name, row.name));
        const ownerId = match?.id ?? id;
        if (!match) players.push({ id, name: normalizeName(row.name), colorIndex: nextColor(players), connected: false, claimed: false });
        byOwner.set(ownerId, { id: `e_${ownerId}`, ownerId, text: row.text.trim() }); // one entry per person
      });
      return { ...s, players, entries: [...byOwner.values()] };
    }

    case 'removePlayer':
      if (s.phase !== 'lobby') return s;
      return {
        ...s,
        players: s.players.filter((p) => p.id !== a.playerId),
        entries: s.entries.filter((e) => e.ownerId !== a.playerId),
      };

    case 'updateSettings':
      if (s.phase !== 'lobby') return s;
      return { ...s, settings: { ...s.settings, ...a.settings } };

    case 'start': {
      if (!canStart(s)) return s;
      const order = shuffle(
        playableEntries(s).map((e) => e.id),
        seeded(a.seed),
      );
      return { ...s, phase: 'showing', order, index: 0, guesses: [], history: {}, deadline: null, revealedAt: null };
    }

    case 'beginGuessing':
      if (s.phase !== 'showing') return s;
      return { ...s, phase: 'guessing', deadline: a.now + s.settings.timerSec * 1000 };

    case 'guess': {
      if (s.phase !== 'guessing' || s.settings.hostOnly) return s;
      const entry = currentEntry(s);
      if (!entry || a.entryId !== entry.id) return s;
      if (!playerById(s, a.playerId) || !playerById(s, a.ownerId)) return s;
      if (entry.ownerId === a.playerId) return s; // can't guess your own entry
      if (a.ownerId === a.playerId) return s; // can't name yourself
      const others = s.guesses.filter((g) => g.playerId !== a.playerId);
      return { ...s, guesses: [...others, { playerId: a.playerId, entryId: a.entryId, ownerId: a.ownerId }] };
    }

    case 'tally': {
      if (!s.settings.hostOnly || (s.phase !== 'locked' && s.phase !== 'reveal')) return s;
      const entry = currentEntry(s);
      if (!entry) return s;
      const guesses = [...new Set(a.playerIds)]
        .filter((id) => id !== entry.ownerId && playerById(s, id))
        .map((playerId) => ({ playerId, entryId: entry.id, ownerId: entry.ownerId }));
      return { ...s, guesses };
    }

    case 'lock':
      if (s.phase !== 'guessing') return s;
      return { ...s, phase: 'locked', deadline: null };

    case 'reveal':
      if (s.phase !== 'guessing' && s.phase !== 'locked') return s;
      return { ...s, phase: 'reveal', deadline: null, revealedAt: a.now };

    case 'next': {
      if (s.phase !== 'reveal') return s;
      const entry = currentEntry(s);
      const history = entry ? { ...s.history, [entry.id]: s.guesses } : s.history;
      const base = { ...s, history, guesses: [], deadline: null, revealedAt: null };
      return isLastEntry(s) ? { ...base, phase: 'finale' } : { ...base, phase: 'showing', index: s.index + 1 };
    }

    case 'restart':
      return { ...s, phase: 'lobby', order: [], index: 0, guesses: [], history: {}, deadline: null, revealedAt: null };
  }
}
