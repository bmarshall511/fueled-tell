import { useEffect, useState } from 'react';
import type { GameState, Intake, ScoringMode } from '../../engine/types';
import { PACKS, packById } from '../../packs';
import { newRow, type DraftRow } from './draftRows';

export interface SetupDraft {
  packId: string;
  intake: Intake;
  rows: DraftRow[];
  timerSec: number;
  scoring: ScoringMode;
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
    packId: s.packId,
    intake: s.settings.intake,
    rows: s.entries.map((e) => newRow(s.players.find((p) => p.id === e.ownerId)?.name ?? '', e.text)),
    timerSec: s.settings.timerSec,
    scoring: s.settings.scoring,
    hostOnly: s.settings.hostOnly,
  };
}

function fresh(): SetupDraft {
  const pack = PACKS[0]!;
  return { packId: pack.id, intake: 'host', rows: [], timerSec: pack.timerSec, scoring: pack.scoring, hostOnly: false };
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
  /** Switching packs also resets timer and scoring to that pack's defaults. */
  const choosePack = (packId: string) => {
    const p = packById(packId);
    setDraft((d) => ({ ...d, packId, timerSec: p.timerSec, scoring: p.scoring }));
  };
  const clearSaved = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  return { draft, editing, set, choosePack, clearSaved };
}
