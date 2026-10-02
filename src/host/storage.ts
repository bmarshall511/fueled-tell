import type { GameState } from '../engine/types';

/** Everything the host needs to resume after a refresh. Lives only in this browser. */
export interface HostSession {
  version: 1;
  roomCode: string;
  state: GameState;
}

/** Same-browser demos (`?transport=local`) keep their own session so they never clobber a real game. */
export const sessionKey = (local = new URLSearchParams(window.location.search).get('transport') === 'local') =>
  `tell:host-session${local ? ':local' : ''}`;

export function loadSession(): HostSession | null {
  try {
    const raw = localStorage.getItem(sessionKey());
    if (!raw) return null;
    const s = JSON.parse(raw) as HostSession;
    return s.version === 1 && s.state && typeof s.roomCode === 'string' ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: HostSession | null): void {
  try {
    if (s) localStorage.setItem(sessionKey(), JSON.stringify(s));
    else localStorage.removeItem(sessionKey());
  } catch {
    /* storage full or blocked: the game still runs, it just won't survive a refresh */
  }
}

/** Download the session as a JSON file (backup, or hand a pre-built game to another pod). */
export function downloadJson(filename: string, data: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<unknown> {
  return JSON.parse(await file.text()) as unknown;
}

export function asSession(v: unknown): HostSession | null {
  const s = v as Partial<HostSession> | null;
  return s && s.version === 1 && typeof s.roomCode === 'string' && s.state && Array.isArray(s.state.players) ? (s as HostSession) : null;
}
