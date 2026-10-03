import { useEffect, useRef, useSyncExternalStore } from 'react';
import { tokens } from '../../tokens/tokens';

/**
 * Easter eggs: tiny shared plumbing. Effects are classes on <html> (`egg-<name>`), so any
 * component's CSS can react without wiring props through the tree. Every egg is short,
 * announced politely to screen readers, and calm under reduced motion (CSS handles that).
 */

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const has = (name: string) => document.documentElement.classList.contains(`egg-${name}`);

/** Turn an effect on for `ms`, then off. */
export function flash(name: string, ms: number): void {
  const root = document.documentElement;
  root.classList.remove(`egg-${name}`);
  void root.offsetWidth; // restart CSS animations if it fires twice in a row
  root.classList.add(`egg-${name}`);
  notify();
  window.setTimeout(() => {
    root.classList.remove(`egg-${name}`);
    notify();
  }, ms);
}

/** Flip a persistent effect (e.g. retro mode); returns the new state. */
export function toggle(name: string): boolean {
  const on = document.documentElement.classList.toggle(`egg-${name}`);
  notify();
  return on;
}

/** Is an effect on right now? Re-renders when it changes. */
export function useEgg(name: string): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => has(name),
  );
}

/** Say something to screen-reader users (a shared polite live region). */
export function announce(message: string): void {
  let region = document.getElementById('egg-announcer');
  if (!region) {
    region = document.createElement('p');
    region.id = 'egg-announcer';
    region.className = 'visually-hidden';
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  region.textContent = '';
  window.setTimeout(() => region && (region.textContent = message), 50);
}

/** Calls `onMatch` when the keys in `sequence` are pressed in order (outside text fields). */
export function useKeySequence(sequence: readonly string[], onMatch: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    let at = 0;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      at = key === sequence[at] ? at + 1 : key === sequence[0] ? 1 : 0;
      if (at === sequence.length) {
        at = 0;
        onMatch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sequence, onMatch, enabled]);
}

/** Returns a click handler that calls `onCombo` after `times` clicks within `windowMs`. */
export function useClickCombo(times: number, windowMs: number, onCombo: () => void): () => void {
  const clicks = useRef<number[]>([]);
  return () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < windowMs), now];
    if (clicks.current.length >= times) {
      clicks.current = [];
      onCombo();
    }
  };
}

export const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

/** A hello for anyone who opens the console. */
export function sayHello(repo: string): void {
  const c = tokens.color;
  const big = `font: 28px ${tokens.font.family.base}; background: linear-gradient(90deg, ${c.fueled.lilac}, ${c.fueled.solar}); -webkit-background-clip: text; color: transparent;`;
  const small = `font: 13px ${tokens.font.family.base}; color: ${c.neutral[300]};`;
  console.log(
    `%c⚡ Tell%c\nEveryone has a story. Can you tell whose?\nBuilt by DOM lab for Fueled · ${repo}\nPsst: there are a few secrets in here.`,
    big,
    small,
  );
}
