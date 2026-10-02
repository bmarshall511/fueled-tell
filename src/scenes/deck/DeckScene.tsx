import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type CSSProperties } from 'react';
import { Color, ExtrudeGeometry, Shape, ShapeGeometry, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { tokens } from '../../tokens/tokens';
import { ItemText } from '../../ui/ItemText';
import { playerColor } from '../../ui/playerColor';
import type { SceneProps } from '../Scene';
import { SceneCanvas } from '../SceneCanvas';
import { CAMERA, approach, useStageToWorld } from '../shared/stage';
import { SceneOverlay } from '../shared/SceneOverlay';
import styles from './DeckScene.module.css';

/** Deck draws the owner's name on the back of the card. */
export const rendersOwnerName = true;

const CARD_DEPTH = 0.08;
const CHIP = { radius: 0.34, height: 0.11, gap: 0.015, offTable: 8 };
const TABLE_Z = -0.6;
/** Where cards come from and go to, in card widths. */
const DEAL_FROM = { x: 1.6, y: 1.2, rot: -0.5 };

/** Card outline with the DOM lab chamfer: cut top-left and bottom-right corners. */
function chamferShape(w: number, h: number, cut: number): Shape {
  const s = new Shape();
  s.moveTo(-w / 2 + cut, h / 2);
  s.lineTo(w / 2, h / 2);
  s.lineTo(w / 2, -h / 2 + cut);
  s.lineTo(w / 2 - cut, -h / 2);
  s.lineTo(-w / 2, -h / 2);
  s.lineTo(-w / 2, h / 2 - cut);
  s.closePath();
  return s;
}

function Card({ phase, itemId, reducedMotion }: { phase: SceneProps['phase']; itemId: string; reducedMotion: boolean }) {
  const toWorld = useStageToWorld();
  const w = toWorld(tokens.size.cardWidth);
  const h = toWorld(tokens.size.itemHeight);
  const offsetY = -toWorld(tokens.size.itemOffsetY);
  const cut = toWorld(tokens.chamfer.lg * 2);

  const { body, face } = useMemo(() => {
    const shape = chamferShape(w, h, cut);
    return {
      body: new ExtrudeGeometry(shape, { depth: CARD_DEPTH, bevelEnabled: false }),
      face: new ShapeGeometry(shape),
    };
  }, [w, h, cut]);

  const group = useRef<Group>(null);
  const flip = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const dealtFor = useRef<string | null>(null);

  useFrame((state, dt) => {
    const g = group.current;
    const f = flip.current;
    if (!g || !f) return;
    if (dealtFor.current !== itemId) {
      // New item: start off-table, then deal in.
      dealtFor.current = itemId;
      g.position.set(w * DEAL_FROM.x, h * DEAL_FROM.y + offsetY, 0);
      g.rotation.set(0, 0, DEAL_FROM.rot);
    }
    const t = state.clock.elapsedTime;
    const idle = reducedMotion || phase !== 'guessing' ? 0 : Math.sin(t * 1.2) * 0.04;
    const pressed = phase === 'locked' ? -0.25 : 0;
    g.position.x = approach(g.position.x, 0, dt, reducedMotion, 5);
    g.position.y = approach(g.position.y, offsetY + idle, dt, reducedMotion, 5);
    g.position.z = approach(g.position.z, pressed, dt, reducedMotion, 10);
    g.rotation.z = approach(g.rotation.z, 0, dt, reducedMotion, 5);
    f.rotation.y = approach(f.rotation.y, phase === 'reveal' ? Math.PI : 0, dt, reducedMotion, 4);
    // A little lift mid-flip gives it weight.
    f.position.z = Math.sin(f.rotation.y) * 0.8;
    // Fake drop shadow on the table: grows and softens as the card lifts.
    const s = shadow.current;
    if (s) {
      const lift = f.position.z - g.position.z;
      s.scale.setScalar(1 + lift * 0.06);
      (s.material as MeshBasicMaterial).opacity = tokens.opacity.muted - lift * 0.2;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={shadow} geometry={face} position={[0.14, -0.22, TABLE_Z + 0.01]}>
        <meshBasicMaterial color={tokens.color.bg} transparent />
      </mesh>
      <group ref={flip}>
      <mesh geometry={body} position-z={-CARD_DEPTH / 2}>
        <meshStandardMaterial color={tokens.color.neutral[700]} roughness={0.6} />
      </mesh>
      <mesh geometry={face} position-z={CARD_DEPTH / 2 + 0.001}>
        <meshBasicMaterial color={tokens.color.fueled.perfectWhite} toneMapped={false} />
      </mesh>
      <mesh geometry={face} position-z={-CARD_DEPTH / 2 - 0.001} rotation-y={Math.PI}>
        <meshBasicMaterial color={tokens.color.accent} toneMapped={false} />
      </mesh>
      </group>
    </group>
  );
}

/** One chip per guess. Anonymous (same color) until reveal, then guesser colors. */
function Chips({ guesses, players, reveal, reducedMotion }: Pick<SceneProps, 'guesses' | 'players' | 'reveal' | 'reducedMotion'>) {
  const toWorld = useStageToWorld();
  const x = toWorld(tokens.size.cardWidth / 2) + CHIP.radius * 2.2;
  const baseY = -toWorld(tokens.size.itemHeight / 2) - toWorld(tokens.size.itemOffsetY);
  const geometry = useMemo(() => new ExtrudeGeometry(chamferShape(CHIP.radius * 2, CHIP.radius * 2, CHIP.radius * 0.5), { depth: CHIP.height, bevelEnabled: false }), []);
  const meshes = useRef<(Mesh | null)[]>([]);

  const colors = useMemo(
    () =>
      guesses.map((g) => {
        const p = players.find((pl) => pl.id === g.playerId);
        return reveal && p ? playerColor(p.colorIndex) : tokens.color.fueled.techGrey;
      }),
    [guesses, players, reveal],
  );
  const correct = (id: string) => reveal?.correctPlayerIds.includes(id) ?? false;

  useFrame((_, dt) => {
    guesses.forEach((g, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const isCorrect = correct(g.playerId);
      // Stack upward on screen like a fanned pile; on reveal, wrong chips slide off the table.
      const targetX = reveal && !isCorrect ? x + CHIP.offTable : x;
      const stackIndex = reveal ? guesses.filter((o, j) => j < i && correct(o.playerId) === isCorrect).length : i;
      const targetY = baseY + stackIndex * (CHIP.height * 2.6 + CHIP.gap) + CHIP.radius;
      m.position.x = approach(m.position.x, targetX, dt, reducedMotion, 7);
      m.position.y = approach(m.position.y, targetY, dt, reducedMotion, 9);
      m.position.z = approach(m.position.z, stackIndex * CHIP.height, dt, reducedMotion, 9);
    });
  });

  return (
    <>
      {guesses.map((g, i) => (
        <mesh
          key={g.playerId}
          ref={(m) => {
            meshes.current[i] = m;
            // New chips drop in from above the stack.
            if (m && m.userData.placed !== true) {
              m.userData.placed = true;
              m.position.set(x, baseY + 4, 2);
            }
          }}
          geometry={geometry}
        >
          <meshStandardMaterial color={new Color(colors[i])} roughness={0.4} />
        </mesh>
      ))}
    </>
  );
}

export default function DeckScene(props: SceneProps) {
  const { phase, item, copy, reveal, players, reducedMotion } = props;
  const owner = players.find((p) => p.id === reveal?.ownerId);
  const revealDelay = { animationDelay: `${tokens.duration.reveal * 0.45}ms` } as CSSProperties;
  const dealDelay = { animationDelay: `${reducedMotion ? 0 : tokens.duration.entrance * 0.55}ms` } as CSSProperties;

  return (
    <>
      <SceneCanvas camera={{ position: [0, 0, CAMERA.distance], fov: CAMERA.fov }}>
        <ambientLight intensity={tokens.scene.ambientIntensity * 2} />
        <directionalLight position={[3, 5, 8]} intensity={tokens.scene.lightIntensity} />
        {/* The table */}
        <mesh position-z={TABLE_Z}>
          <planeGeometry args={[60, 40]} />
          <meshStandardMaterial color={tokens.color.surface} roughness={1} />
        </mesh>
        <Card phase={phase} itemId={item.id} reducedMotion={reducedMotion} />
        <Chips guesses={props.guesses} players={players} reveal={reveal} reducedMotion={reducedMotion} />
      </SceneCanvas>

      <SceneOverlay>
        <div key={item.id} className={`${styles.front} ${phase === 'reveal' ? 'fade-out' : 'fade-in'}`} style={dealDelay}>
          <ItemText text={item.text} label={`${copy.item} ${item.index + 1}`} />
        </div>
        {phase === 'reveal' && owner && (
          <div className={`fade-in ${styles.back}`} style={revealDelay}>
            <p className="t-label">{copy.reveal}</p>
            <p className="t-hero">{owner.name}</p>
          </div>
        )}
      </SceneOverlay>
    </>
  );
}
