import { useEffect, useRef } from 'react';

/** Shortcut map: a lowercase key (`'r'`) or a KeyboardEvent.code (`'Space'`). */
export type Shortcuts = Partial<Record<string, () => void>>;

/**
 * Global keyboard shortcuts. Ignored while typing in a field or a dialog, and
 * Space / Enter are left to a focused button or link (so they press it instead).
 */
export function useKeyboardShortcuts(shortcuts: Shortcuts, onAnyKey?: () => void): void {
  const ref = useRef(shortcuts);
  ref.current = shortcuts;
  const anyRef = useRef(onAnyKey);
  anyRef.current = onAnyKey;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      anyRef.current?.();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select, dialog')) return;
      if (target?.closest('button, a') && (e.code === 'Space' || e.code === 'Enter')) return;
      const action = ref.current[e.code] ?? ref.current[e.key.toLowerCase()];
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
