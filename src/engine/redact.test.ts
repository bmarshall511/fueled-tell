import { describe, expect, it } from 'vitest';
import { currentEntry } from './game';
import { redactFor } from './redact';
import { lobbyWithFour, run } from './testing';

describe('redactFor', () => {
  const s = run(lobbyWithFour(), { type: 'start', seed: 3 }, { type: 'beginGuessing', now: 1000 });
  const entry = currentEntry(s)!;
  const outsider = s.players.find((p) => p.id !== entry.ownerId)!.id;

  it('never leaks the owner or other entries before the reveal', () => {
    const view = redactFor(s, outsider, 2000);
    const json = JSON.stringify(view);
    expect(view.item).toEqual({ id: entry.id, text: entry.text, mine: false });
    expect(view.reveal).toBeNull();
    for (const e of s.entries.filter((x) => x.id !== entry.id)) expect(json).not.toContain(e.text);
    expect(json).not.toContain('ownerId');
  });

  it('tells the owner it is theirs', () => {
    expect(redactFor(s, entry.ownerId, 2000).item?.mine).toBe(true);
  });

  it('sends remaining time, not the host clock', () => {
    expect(redactFor(s, outsider, 11_000).remainingMs).toBe(20_000);
  });

  it('includes only my own guess', () => {
    const third = s.players.find((p) => p.id !== entry.ownerId && p.id !== outsider)!.id;
    const g = run(s, { type: 'guess', playerId: third, entryId: entry.id, ownerId: entry.ownerId });
    const view = redactFor(g, outsider, 2000);
    expect(view.myGuess).toBeNull();
    expect(view.guessedCount).toBe(1);
    expect(JSON.stringify(view)).not.toContain(`"ownerId":"${entry.ownerId}"`);
  });

  it('reveals the owner and who got it at reveal', () => {
    const g = run(s, { type: 'guess', playerId: outsider, entryId: entry.id, ownerId: entry.ownerId }, { type: 'reveal', now: 3000 });
    const view = redactFor(g, outsider, 3500);
    expect(view.reveal).toMatchObject({ ownerId: entry.ownerId, correctPlayerIds: [outsider] });
    expect(view.revealElapsedMs).toBe(500);
  });

  it('shows my own submitted entry in the lobby, not anyone else’s', () => {
    const view = redactFor(lobbyWithFour(), 'a', 0);
    expect(view.myEntry).toBe('entry by a');
    expect(JSON.stringify(view)).not.toContain('entry by b');
  });
});
