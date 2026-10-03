import { useCallback, useEffect, useRef } from 'react';
import type { Phase } from '../../engine/types';
import { UI_COPY } from '../../ui/copy';
import { announce, flash, KONAMI, toggle, useKeySequence } from '../../ui/lib/eggs';
import { tokens } from '../../tokens/tokens';
import { ShortcutsDialog } from './ShortcutsDialog';

const E = UI_COPY.eggs;
const TELL = ['t', 'e', 'l', 'l'] as const;

/**
 * The host's hidden inputs:
 * - "tell" in the lobby or finale: a gradient wave across the room code / winner (the L key is lock during rounds).
 * - The Konami code during rounds: retro (pixel) mode for the 3D deck, again to turn it off.
 * - "?": the shortcuts list, which hints that there's more to find.
 */
export function HostEggs({ phase }: { phase: Phase | null }) {
  const shortcuts = useRef<HTMLDialogElement>(null);
  const between = phase === null || phase === 'lobby' || phase === 'finale';

  useKeySequence(
    TELL,
    useCallback(() => {
      flash('tell', tokens.duration.reveal);
      announce(E.found);
    }, []),
    between,
  );
  useKeySequence(
    KONAMI,
    useCallback(() => announce(toggle('retro') ? E.retroOn : E.retroOff), []),
    !between,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== '?' || t?.closest?.('input, textarea, select, dialog')) return;
      e.preventDefault();
      shortcuts.current?.showModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <ShortcutsDialog ref={shortcuts} />;
}
