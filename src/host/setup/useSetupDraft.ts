import { useEffect, useState } from 'react';
import type { GameState, Intake } from '../../engine/types';
import { GAME } from '../../content';
import { newRow, type DraftRow } from './draftRows';

export interface SetupDraft {
  intake: Intake;
  rows: DraftRow[];
  timerSec: number;
  hostOnly: boolean;
}

const KEY = 'tell:setup-draft';

function loadSaved(): SetupDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? 'null') as SetupDraft | null;
    return d && Array.isArray(d.rows) ? { ...d, rows: d.rows.map((r) => newRow(r.name, r.text)) } : null;
  } catch {
    return null;
  }
}

/** The open lobby as a draft, for "Back to setup". */
function fromGame(s: GameState): SetupDraft {
  return {
    intake: s.settings.intake,
    rows: s.entries.map((e) => newRow(s.players.find((p) => p.id === e.ownerId)?.name ?? '', e.text)),
    timerSec: s.settings.timerSec,
    hostOnly: s.settings.hostOnly,
  };
}

function fresh(): SetupDraft {
  return { intake: 'host', rows: [], timerSec: GAME.timerSec, hostOnly: false };
}

/**
 * The setup form's state. A new game starts from the autosaved draft (so a refresh
 * keeps your typing); editing an open lobby starts from the game and isn't autosaved.
 */
export function useSetupDraft(game: GameState | null) {
  const editing = game?.phase === 'lobby';
  // Read once on mount: later edits stay local until saved.
  const [draft, setDraft] = useState<SetupDraft>(() => (editing && game ? fromGame(game) : (loadSaved() ?? fresh())));

  useEffect(() => {
    if (editing) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(draft));
    } catch {
      /* draft not saved */
    }
  }, [editing, draft]);

  const set = <K extends keyof SetupDraft>(key: K, value: SetupDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const clearSaved = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  return { draft, editing, set, clearSaved };
}
