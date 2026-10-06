import type { PlayerView } from '../engine/redact';
import type { ClientStatus } from '../transport/Transport';

export type ScreenKind = 'ended' | 'code' | 'connecting' | 'notFound' | 'join' | 'lobby' | 'pick' | 'waiting' | 'yours' | 'result' | 'final';

/** Which screen the phone shows; `key` changes whenever the screen should transition (new entry, new kind). */
export interface Screen {
  kind: ScreenKind;
  key: string;
}

interface Inputs {
  room: string | null;
  status: ClientStatus | 'idle';
  view: PlayerView | null;
  joined: boolean;
  /** The player tapped "Change my guess". */
  changing: boolean;
  /** The host ended the game (we've left the room). */
  ended?: boolean;
}

export function screenFor({ room, status, view, joined, changing, ended }: Inputs): Screen {
  const s = (kind: ScreenKind, id = ''): Screen => ({ kind, key: id ? `${kind}:${id}` : kind });
  if (ended) return s('ended');
  if (!room) return s('code');
  if (!view) return s(status === 'not-found' ? 'notFound' : 'connecting');
  if (!joined) return s('join');
  if (view.phase === 'lobby') return s('lobby');
  if (view.phase === 'finale') return s('final');
  const id = view.item?.id ?? '';
  if (view.phase === 'reveal') return s('result', id);
  if (view.item?.mine) return s('yours', id);
  if (view.phase === 'showing' || (view.phase === 'guessing' && (!view.myGuess || changing))) return s('pick', id);
  return s('waiting', id);
}

/** The kind encoded in a screen key (the transition hook hands back keys). */
export const kindOf = (key: string): ScreenKind => key.split(':')[0] as ScreenKind;
