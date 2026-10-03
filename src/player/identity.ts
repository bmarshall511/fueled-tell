import { makeId } from '../engine/random';
import type { PlayerId } from '../engine/types';

/** Who this phone is, persisted so a refresh rejoins as the same player. */
export interface Identity {
  playerId: PlayerId;
  room: string | null;
  name: string;
  /** The room this identity has actually joined; the saved name only auto-rejoins that room. */
  joinedRoom?: string | null;
  /** Secret proving this phone owns its seat (sent only to the host). */
  key?: string;
}

/** `?seat=2` gives a separate identity per tab (demo / testing several phones in one browser). */
export const identityKey = (seat = new URLSearchParams(window.location.search).get('seat') ?? '') => `tell:player${seat}`;

const newKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${makeId('k')}${makeId('k')}`);

/** A brand-new seat: new player id and key, not joined anywhere. */
export const freshSeat = (): Pick<Identity, 'playerId' | 'key' | 'name' | 'joinedRoom'> => ({
  playerId: makeId('u'),
  key: newKey(),
  name: '',
  joinedRoom: null,
});

export function loadIdentity(): Identity {
  try {
    const raw = localStorage.getItem(identityKey());
    if (raw) {
      const id = JSON.parse(raw) as Identity;
      return id.key ? id : { ...id, key: newKey() };
    }
  } catch {
    /* fall through */
  }
  return { room: null, ...freshSeat() };
}

export function saveIdentity(id: Identity) {
  try {
    localStorage.setItem(identityKey(), JSON.stringify(id));
  } catch {
    /* private mode: rejoin after refresh will need the name again */
  }
}
