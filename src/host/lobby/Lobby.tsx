import { useEffect, useRef } from 'react';
import { gamePrompt } from '../../content';
import { canStart, playableEntries } from '../../engine/game';
import { RULES } from '../../engine/rules';
import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
import { useDocumentTitle } from '../../ui/hooks/useDocumentTitle';
import { useKeyboardShortcuts } from '../../ui/hooks/useKeyboardShortcuts';
import { plural } from '../../ui/lib/format';
import { HostBrand } from '../components/HostBrand';
import { HostControls } from '../components/HostControls';
import { HostStage } from '../components/HostStage';
import { sound } from '../sound';
import type { HostGame } from '../state/useHostGame';
import { HostOnlyIntro, JoinPanel } from './JoinPanel';
import { RoomProblem } from './RoomProblem';
import { Roster } from './Roster';
import styles from './Lobby.module.css';

const L = UI_COPY.lobby;

/** Shared on the call: big room code, QR, and who's in. Never shows who wrote what. */
export function Lobby({ host, onEdit }: { host: HostGame; onEdit: () => void }) {
  const s = host.state!;
  const code = host.roomCode!;
  const hostOnly = s.settings.hostOnly;
  const entries = playableEntries(s).length;
  const joined = s.players.filter((p) => p.claimed && p.connected).length;
  const ready = canStart(s);
  useDocumentTitle(code);
  useKeyboardShortcuts({ Space: () => ready && host.advance() });
  useJoinChime(joined);

  const summary = [
    hostOnly ? plural(s.players.length, L.people) : `${joined} ${L.joined}`,
    plural(entries, L.entries),
    entries < RULES.minEntries ? L.needMore : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <HostStage className={styles.lobby}>
      <header className={styles.top}>
        <HostBrand />
      </header>

      {hostOnly ? (
        <HostOnlyIntro />
      ) : (
        <JoinPanel
          code={code}
          prompt={gamePrompt(s.settings)}
          status={
            host.link === 'opening' ? <p className="t-label">{L.opening}</p> : host.link === 'error' ? <RoomProblem host={host} /> : null
          }
        />
      )}

      <Roster state={s} summary={summary} onRemove={(p) => host.dispatch({ type: 'removePlayer', playerId: p.id })} />

      <HostControls className={styles.controls}>
        <Button size="host" variant="secondary" onClick={onEdit}>
          {L.edit}
        </Button>
        <Button size="host" disabled={!ready} onClick={host.advance} shortcut="Space" aria-keyshortcuts="Space">
          {UI_COPY.start}
        </Button>
      </HostControls>
    </HostStage>
  );
}

/** A soft chime whenever someone joins. */
function useJoinChime(joined: number) {
  const prev = useRef(joined);
  useEffect(() => {
    if (joined > prev.current) sound.join();
    prev.current = joined;
  }, [joined]);
}
