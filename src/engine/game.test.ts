import { describe, expect, it } from 'vitest';
import {
  canStart,
  createGame,
  currentEntry,
  expectedGuessers,
  gameReducer,
  guessersForReveal,
  markAllDisconnected,
  validateJoin,
} from './game';
import { lobbyWithFour, run, TEST_PACK } from './testing';

const started = () => run(lobbyWithFour(), { type: 'start', seed: 1 });

describe('lobby', () => {
  it('adds players on join and re-joins without duplicating', () => {
    let s = createGame(TEST_PACK);
    s = run(s, { type: 'join', playerId: 'a', name: '  Ada  Lovelace ' });
    s = run(s, { type: 'disconnect', playerId: 'a' }, { type: 'join', playerId: 'a', name: 'Ada' });
    expect(s.players).toHaveLength(1);
    expect(s.players[0]).toMatchObject({ name: 'Ada Lovelace', connected: true, claimed: true });
  });

  it('rejects a name already claimed by another phone, case-insensitively', () => {
    const s = run(createGame(TEST_PACK), { type: 'join', playerId: 'a', name: 'Ada' });
    expect(validateJoin(s, 'b', 'ada')).toBe('nameTaken');
    expect(run(s, { type: 'join', playerId: 'b', name: 'ada' }).players).toHaveLength(1);
  });

  it('lets a phone claim a host-imported name and keeps their entry', () => {
    let s = createGame(TEST_PACK);
    s = run(s, {
      type: 'setRoster',
      rows: [
        { name: 'Ada', text: 'hi' },
        { name: 'Bo', text: 'yo' },
      ],
      ids: ['i1', 'i2'],
    });
    expect(s.players.every((p) => !p.claimed)).toBe(true);
    s = run(s, { type: 'join', playerId: 'phone1', name: '', claimId: 'i1' });
    expect(s.players.find((p) => p.id === 'phone1')).toMatchObject({ name: 'Ada', claimed: true });
    expect(s.entries.find((e) => e.text === 'hi')?.ownerId).toBe('phone1');
    // Typing the same name also claims it.
    s = run(s, { type: 'join', playerId: 'phone2', name: 'bo' });
    expect(s.entries.find((e) => e.text === 'yo')?.ownerId).toBe('phone2');
    expect(s.players).toHaveLength(2);
  });

  it('accepts live submissions only in live intake, and replaces a resubmission', () => {
    let s = run(createGame(TEST_PACK), { type: 'join', playerId: 'a', name: 'A' });
    expect(run(s, { type: 'submit', playerId: 'a', text: 'x' }).entries).toHaveLength(0);
    s = run(s, { type: 'updateSettings', settings: { intake: 'live' } });
    s = run(s, { type: 'submit', playerId: 'a', text: 'first' }, { type: 'submit', playerId: 'a', text: 'second' });
    expect(s.entries.map((e) => e.text)).toEqual(['second']);
    expect(run(s, { type: 'submit', playerId: 'a', text: 'x'.repeat(51) }).entries[0]?.text).toBe('second');
  });

  it('needs at least 3 playable entries to start', () => {
    let s = run(
      createGame(TEST_PACK, { intake: 'live' }),
      { type: 'join', playerId: 'a', name: 'A' },
      { type: 'submit', playerId: 'a', text: 't' },
    );
    expect(canStart(s)).toBe(false);
    expect(run(s, { type: 'start', seed: 1 }).phase).toBe('lobby');
    s = lobbyWithFour();
    expect(canStart(s)).toBe(true);
  });

  it('removing a player removes their entry', () => {
    const s = run(lobbyWithFour(), { type: 'removePlayer', playerId: 'a' });
    expect(s.players.map((p) => p.id)).toEqual(['b', 'c', 'd']);
    expect(s.entries.some((e) => e.ownerId === 'a')).toBe(false);
  });
});

describe('roster edits and seats', () => {
  it('editing the roster in live mode never duplicates entries', () => {
    let s = lobbyWithFour();
    const rows = s.entries.map((e) => ({ name: s.players.find((p) => p.id === e.ownerId)!.name, text: e.text }));
    s = run(s, { type: 'setRoster', rows, ids: rows.map((_, i) => `p_${i}`) });
    expect(s.entries).toHaveLength(4);
    expect(new Set(s.entries.map((e) => e.id)).size).toBe(4);
    expect(new Set(s.entries.map((e) => e.ownerId)).size).toBe(4);
  });

  it('a seat with a key can only be re-joined by the same phone', () => {
    let s = run(createGame(TEST_PACK), { type: 'join', playerId: 'a', name: 'Ada', key: 'k1' });
    expect(validateJoin(s, 'a', '', undefined, 'other')).toBe('notYou');
    expect(validateJoin(s, 'a', '', undefined, 'k1')).toBeNull();
    s = run(s, { type: 'disconnect', playerId: 'a' }, { type: 'join', playerId: 'a', name: '', key: 'nope' });
    expect(s.players[0]?.connected).toBe(false);
  });

  it('after a host reload nobody counts as connected until their phone returns', () => {
    const s = markAllDisconnected(lobbyWithFour());
    expect(s.players.every((p) => !p.connected)).toBe(true);
  });
});

describe('round loop', () => {
  it('walks showing -> guessing -> locked -> reveal -> next', () => {
    let s = started();
    expect(s.phase).toBe('showing');
    expect(s.order).toHaveLength(4);
    s = run(s, { type: 'beginGuessing', now: 1000 });
    expect(s).toMatchObject({ phase: 'guessing', deadline: 1000 + 30_000 });
    s = run(s, { type: 'lock' });
    expect(s).toMatchObject({ phase: 'locked', deadline: null });
    s = run(s, { type: 'reveal', now: 5000 });
    expect(s).toMatchObject({ phase: 'reveal', revealedAt: 5000 });
    s = run(s, { type: 'next' });
    expect(s).toMatchObject({ phase: 'showing', index: 1, guesses: [] });
  });

  it('can reveal straight from guessing', () => {
    const s = run(started(), { type: 'beginGuessing', now: 0 }, { type: 'reveal', now: 1 });
    expect(s.phase).toBe('reveal');
  });

  it('ignores actions in the wrong phase', () => {
    const s = started();
    for (const a of [{ type: 'lock' }, { type: 'reveal', now: 1 }, { type: 'next' }] as const) {
      expect(gameReducer(s, a)).toBe(s);
    }
  });

  it("can't guess your own entry or name yourself; a new guess replaces the old one", () => {
    let s = run(started(), { type: 'beginGuessing', now: 0 });
    const entry = currentEntry(s)!;
    const owner = entry.ownerId;
    const other = s.players.find((p) => p.id !== owner)!.id;
    const third = s.players.find((p) => p.id !== owner && p.id !== other)!.id;
    expect(run(s, { type: 'guess', playerId: owner, entryId: entry.id, ownerId: other }).guesses).toHaveLength(0);
    expect(run(s, { type: 'guess', playerId: other, entryId: entry.id, ownerId: other }).guesses).toHaveLength(0);
    s = run(
      s,
      { type: 'guess', playerId: other, entryId: entry.id, ownerId: third },
      { type: 'guess', playerId: other, entryId: entry.id, ownerId: owner },
    );
    expect(s.guesses).toEqual([{ playerId: other, entryId: entry.id, ownerId: owner }]);
  });

  it('rejects guesses for a stale entry', () => {
    const s = run(started(), { type: 'beginGuessing', now: 0 });
    const stale = s.order[1]!;
    expect(run(s, { type: 'guess', playerId: 'a', entryId: stale, ownerId: 'b' }).guesses).toHaveLength(0);
  });

  it('expects guesses from connected non-owners only', () => {
    let s = run(started(), { type: 'beginGuessing', now: 0 });
    const owner = currentEntry(s)!.ownerId;
    expect(expectedGuessers(s).map((p) => p.id)).not.toContain(owner);
    expect(expectedGuessers(s)).toHaveLength(3);
    const someoneElse = s.players.find((p) => p.id !== owner)!.id;
    s = run(s, { type: 'disconnect', playerId: someoneElse });
    expect(expectedGuessers(s)).toHaveLength(2);
  });

  it('records history and goes to the finale after the last entry, then restarts', () => {
    let s = started();
    for (let i = 0; i < 4; i++) s = run(s, { type: 'beginGuessing', now: 0 }, { type: 'reveal', now: 0 }, { type: 'next' });
    expect(s.phase).toBe('finale');
    expect(Object.keys(s.history)).toHaveLength(4);
    s = run(s, { type: 'restart' });
    expect(s).toMatchObject({ phase: 'lobby', order: [], history: {} });
    expect(s.players).toHaveLength(4);
    expect(s.entries).toHaveLength(4);
  });
});

describe('host-only mode', () => {
  it('ignores phone guesses and takes the host tally instead', () => {
    let s = run(
      lobbyWithFour(),
      { type: 'updateSettings', settings: { hostOnly: true } },
      { type: 'start', seed: 2 },
      { type: 'beginGuessing', now: 0 },
    );
    const entry = currentEntry(s)!;
    const others = s.players.filter((p) => p.id !== entry.ownerId).map((p) => p.id);
    expect(run(s, { type: 'guess', playerId: others[0]!, entryId: entry.id, ownerId: entry.ownerId }).guesses).toHaveLength(0);
    s = run(s, { type: 'lock' }, { type: 'tally', playerIds: [others[0]!, entry.ownerId, others[0]!] });
    expect(s.guesses).toEqual([{ playerId: others[0], entryId: entry.id, ownerId: entry.ownerId }]);
    // 1 of 3 possible guessers got it: the percentage is out of everyone, not just those ticked.
    expect(guessersForReveal(s)).toBe(3);
  });
});
