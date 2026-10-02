import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import {
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three';
import { tokens } from '../../tokens/tokens';
import { ItemText } from '../../ui/components/ItemText';
import { playerColor } from '../../ui/lib/playerColor';
import type { SceneProps } from '../Scene';
import { SceneCanvas } from '../SceneCanvas';
import { CAMERA, approach, useStage } from '../shared/stage';
import { SceneOverlay } from '../shared/SceneOverlay';
import styles from './DeckScene.module.css';

/** Deck draws the owner's name on the back of the card. */
export const rendersOwnerName = true;

const CARD_DEPTH = 0.08;
const CHIP = { depth: 0.14, spacing: 1.3, columns: 2, dropHeight: 3, sideShade: 0.5, maxJitter: 0.18 };
const TABLE_Z = -0.6;
const GRADIENT_SIZE = 256;
/** Where cards come from and go to, in card widths. */
const DEAL_FROM = { x: 1.6, y: 1.2, rot: -0.5 };

/** Rounded-rectangle outline, centered on the origin. */
function roundedShape(w: number, h: number, r: number): Shape {
  const x = -w / 2;
  const y = -h / 2;
  const s = new Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** ShapeGeometry UVs are in shape units; map them to 0..1 so a texture fills the face. */
function normalizeUvs(g: ShapeGeometry, w: number, h: number): ShapeGeometry {
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  if (!pos || !uv) return g;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

/** The glow gradient (Solar → Nebula → deep violet, 135°) as a texture for the card back. */
function glowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = GRADIENT_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = tokens.color.fueled;
    // Canvas y runs down, the UVs run up: top-left to bottom-right on the card.
    const g = ctx.createLinearGradient(0, 0, GRADIENT_SIZE, GRADIENT_SIZE);
    g.addColorStop(0, c.solar);
    g.addColorStop(0.6, c.nebula);
    g.addColorStop(1, c.deepViolet);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GRADIENT_SIZE, GRADIENT_SIZE);
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function Card({ phase, itemId, reducedMotion }: { phase: SceneProps['phase']; itemId: string; reducedMotion: boolean }) {
  const { layout, toWorld } = useStage();
  const w = toWorld(layout.cardWidth);
  const h = toWorld(layout.itemHeight);
  const offsetY = -toWorld(layout.itemOffsetY);
  const radius = toWorld(tokens.radius.card * 2);

  const { body, face } = useMemo(() => {
    const shape = roundedShape(w, h, radius);
    return {
      body: new ExtrudeGeometry(shape, { depth: CARD_DEPTH, bevelEnabled: false }),
      face: normalizeUvs(new ShapeGeometry(shape, 12), w, h),
    };
  }, [w, h, radius]);
  const back = useMemo(glowTexture, []);
  useEffect(() => () => [body, face].forEach((g) => g.dispose()), [body, face]);
  useEffect(() => () => back.dispose(), [back]);

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
          <meshBasicMaterial map={back} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

interface ChipsProps extends Pick<SceneProps, 'guesses' | 'players' | 'reveal' | 'reducedMotion'> {
  slots: number;
}

/**
 * One chip per guess, landing in a tidy pot beside the card (below it in
 * portrait). Anonymous grey until reveal; then guesser colors, correct chips
 * regroup at the front and wrong ones slide off the table.
 */
function Chips({ guesses, players, reveal, reducedMotion, slots }: ChipsProps) {
  const { layout, toWorld } = useStage();
  const size = toWorld(tokens.size.chip);
  const step = size * CHIP.spacing;
  const cardW = toWorld(layout.cardWidth);
  const cardH = toWorld(layout.itemHeight);
  const offsetY = -toWorld(layout.itemOffsetY);
  const portrait = layout.orientation === 'portrait';

  /** Slot k: a 2-column pot right of the card, or one centered row under it. */
  const slot = (k: number): [number, number] => {
    if (portrait) {
      return [(k - (slots - 1) / 2) * step, offsetY - cardH / 2 - step * 0.9];
    }
    const col = k % CHIP.columns;
    const row = Math.floor(k / CHIP.columns);
    return [cardW / 2 + step * (0.85 + col), offsetY - cardH / 2 + size / 2 + row * step];
  };
  const offTable: [number, number] = portrait ? [0, -toWorld(layout.refHeight)] : [toWorld(layout.refWidth), 0];

  const geometry = useMemo(
    () => new ExtrudeGeometry(roundedShape(size, size, size * 0.32), { depth: CHIP.depth, bevelEnabled: false }),
    [size],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const meshes = useRef<(Mesh | null)[]>([]);
  const correct = (id: string) => reveal?.correctPlayerIds.includes(id) ?? false;

  useFrame((_, dt) => {
    guesses.forEach((g, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const isCorrect = correct(g.playerId);
      const k = reveal && isCorrect ? guesses.filter((o, j) => j < i && correct(o.playerId)).length : i;
      const [sx, sy] = slot(k);
      const gone = reveal !== null && !isCorrect;
      const tx = gone ? sx + offTable[0] : sx;
      const ty = gone ? sy + offTable[1] : sy;
      m.position.x = approach(m.position.x, tx, dt, reducedMotion, gone ? 2.5 : 8);
      m.position.y = approach(m.position.y, ty, dt, reducedMotion, gone ? 2.5 : 8);
      // Drops from above the table and lands with weight.
      m.position.z = approach(m.position.z, 0, dt, reducedMotion, 10);
      m.rotation.z = approach(m.rotation.z, reveal ? 0 : jitter(g.playerId), dt, reducedMotion, 8);
    });
  });

  return (
    <>
      {guesses.map((g, i) => {
        const p = players.find((pl) => pl.id === g.playerId);
        const face = new Color(reveal && p ? playerColor(p.colorIndex) : tokens.color.fueled.techGrey);
        const side = face.clone().multiplyScalar(CHIP.sideShade);
        return (
          <mesh
            key={g.playerId}
            ref={(m) => {
              meshes.current[i] = m;
              if (m && m.userData.placed !== true) {
                m.userData.placed = true;
                const [sx, sy] = slot(i);
                m.position.set(sx, sy, CHIP.dropHeight);
              }
            }}
            geometry={geometry}
          >
            <meshBasicMaterial attach="material-0" color={face} toneMapped={false} />
            <meshBasicMaterial attach="material-1" color={side} toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
}

/** Stable small rotation per player so the pot looks hand-placed. */
function jitter(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((h % 100) / 100) * CHIP.maxJitter;
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
        <Card phase={phase} itemId={item.id} reducedMotion={reducedMotion} />
        <Chips guesses={props.guesses} players={players} reveal={reveal} reducedMotion={reducedMotion} slots={players.length - 1} />
      </SceneCanvas>

      <SceneOverlay>
        <div
          key={item.id}
          className={`${styles.front} ${phase === 'reveal' ? 'fade-out' : 'fade-in'}`}
          style={dealDelay}
          aria-hidden={phase === 'reveal'}
        >
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
