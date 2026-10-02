import { useEffect, useRef } from 'react';
import type { Standing } from '../engine/scoring';
import type { GamePhase, PlayerId } from '../engine/types';

/**
 * Mock-only sync between the host and phone mockups in the /demo walkthrough,
 * over BroadcastChannel (same browser, no network). Phase 1 replaces this with
 * the real Transport interface and its `local` adapter.
 */
export type DemoMsg =
  | { type: 'hello' }
  | { type: 'join'; name: string }
  | { type: 'guess'; ownerId: PlayerId }
  | { type: 'start' }
  | {
      type: 'state';
      phase: GamePhase;
      index: number;
      total: number;
      text: string;
      /** True when the current entry is the phone player's own. */
      mine: boolean;
      /** Phone player's result once revealed: null if they didn't guess. */
      result: { ownerId: PlayerId; correct: boolean | null } | null;
      standings: Standing[] | null;
    };

export const isDemo = (): boolean => new URLSearchParams(window.location.search).has('demo');

const CHANNEL = 'whose-is-it:demo';

/** Subscribe to demo messages; returns a stable `send`. No-op outside ?demo. */
export function useDemoChannel(onMessage: (msg: DemoMsg) => void): (msg: DemoMsg) => void {
  const channel = useRef<BroadcastChannel | null>(null);
  const handler = useRef(onMessage);
  handler.current = onMessage;
  useEffect(() => {
    if (!isDemo() || typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e: MessageEvent<DemoMsg>) => handler.current(e.data);
    channel.current = ch;
    return () => {
      ch.close();
      channel.current = null;
    };
  }, []);
  const send = useRef((msg: DemoMsg) => channel.current?.postMessage(msg));
  return send.current;
}
