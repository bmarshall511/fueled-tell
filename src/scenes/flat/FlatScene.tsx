import { useContext, useEffect, type CSSProperties } from 'react';
import { ItemText } from '../../ui/components/ItemText';
import { playerColorVar } from '../../ui/lib/playerColor';
import type { SceneProps } from '../Scene';
import { SceneReadyContext } from '../sceneReady';
import { SceneOverlay } from '../shared/SceneOverlay';
import styles from './FlatScene.module.css';

/** The flat scene draws the owner's name on the back of the card, like Deck. */
export const rendersOwnerName = true;

/**
 * 2D Deck: same card, flip and chip pot in plain HTML/CSS. Used for reduced
 * motion, browsers without WebGL, and `?scene=flat`. No Three.js.
 */
export default function FlatScene({ phase, item, copy, reveal, players, guesses, reducedMotion }: SceneProps) {
  const ready = useContext(SceneReadyContext);
  useEffect(() => ready(), [ready]);
  const owner = players.find((p) => p.id === reveal?.ownerId);
  const flipped = phase === 'reveal';
  const correct = new Set(reveal?.correctPlayerIds ?? []);
  const slots = Math.max(players.length - 1, guesses.length);

  return (
    <div className={`${styles.scene} ${reducedMotion ? styles.calm : ''}`} aria-hidden={false}>
      <SceneOverlay>
        <div className={styles.table}>
          <div key={item.id} className={`${styles.card} ${flipped ? styles.flipped : ''} ${phase === 'locked' ? styles.pressed : ''}`}>
            <div className={`${styles.face} ${styles.front}`} aria-hidden={flipped}>
              <ItemText text={item.text} label={`${copy.item} ${item.index + 1}`} />
            </div>
            <div className={`glow-fill ${styles.face} ${styles.back}`} aria-hidden={!flipped}>
              {owner && (
                <>
                  <p className="t-label">{copy.reveal}</p>
                  <p className="t-hero">{owner.name}</p>
                </>
              )}
            </div>
          </div>
          <ul className={styles.pot} aria-hidden="true">
            {Array.from({ length: slots }, (_, i) => {
              const g = guesses[i];
              const p = g && players.find((pl) => pl.id === g.playerId);
              const gone = flipped && g && !correct.has(g.playerId);
              const style = p && flipped ? ({ '--chip': playerColorVar(p.colorIndex) } as CSSProperties) : undefined;
              return (
                <li
                  key={g?.playerId ?? `empty-${i}`}
                  className={`${styles.chip} ${g ? styles.landed : ''} ${gone ? styles.gone : ''}`}
                  style={style}
                />
              );
            })}
          </ul>
        </div>
      </SceneOverlay>
    </div>
  );
}
