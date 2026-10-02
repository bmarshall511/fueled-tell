import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type Points } from 'three';
import { tokens } from '../../tokens/tokens';
import { ItemText } from '../../ui/ItemText';
import { playerColor } from '../../ui/playerColor';
import type { SceneProps } from '../Scene';
import { SceneCanvas } from '../SceneCanvas';
import { CAMERA } from '../shared/stage';
import { SceneOverlay } from '../shared/SceneOverlay';
import { sampleElementText } from './sampleText';
import styles from './SignalScene.module.css';

/** Signal forms the owner's name out of particles. */
export const rendersOwnerName = true;

const COUNT = 7000;
const MAX_TEXT = 4800;
const FIELD = { x: 9, y: 5, z: 3 };
const GRID = 0.36;
const PULSE = { speed: 7, width: 0.6, life: 1.6 };

interface Targets {
  /** Screen-space px pairs, relative to the viewport center. */
  item: Float32Array | null;
  name: Float32Array | null;
}

interface FieldProps extends Pick<SceneProps, 'phase' | 'guesses' | 'players' | 'reveal' | 'reducedMotion'> {
  targets: Targets;
}

function Field({ phase, guesses, players, reveal, reducedMotion, targets }: FieldProps) {
  const ref = useRef<Points>(null);
  const { viewport, size } = useThree();
  const pxToWorld = viewport.width / size.width;

  const { geometry, home, speed, base } = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const home = new Float32Array(COUNT * 3);
    const speed = new Float32Array(COUNT);
    const base = new Float32Array(COUNT * 3);
    const neutral = new Color(tokens.color.neutral[500]);
    const accents = Object.values(tokens.color.player).map((c) => new Color(c));
    for (let i = 0; i < COUNT; i++) {
      home[i * 3] = (Math.random() * 2 - 1) * FIELD.x;
      home[i * 3 + 1] = (Math.random() * 2 - 1) * FIELD.y;
      home[i * 3 + 2] = (Math.random() * 2 - 1) * FIELD.z;
      pos.set(home.subarray(i * 3, i * 3 + 3), i * 3);
      speed[i] = 1.5 + Math.random() * 3;
      const c = Math.random() < 0.08 ? (accents[i % accents.length] ?? neutral) : neutral;
      c.toArray(base, i * 3);
    }
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('color', new BufferAttribute(base.slice(), 3));
    return { geometry: geo, home, speed, base };
  }, []);

  // A pulse ripples through the field each time a guess lands.
  const pulses = useRef<{ t: number; x: number; y: number }[]>([]);
  const seen = useRef(0);
  const clock = useRef(0);
  useEffect(() => {
    if (guesses.length > seen.current && phase === 'guessing') {
      pulses.current.push({ t: clock.current, x: (Math.random() * 2 - 1) * FIELD.x * 0.7, y: (Math.random() * 2 - 1) * FIELD.y * 0.6 });
    }
    seen.current = guesses.length;
  }, [guesses.length, phase]);

  const colors = useMemo(() => {
    const text = new Color(tokens.color.text);
    const settled = new Color(tokens.color.border);
    const highlight = new Color(tokens.color.highlight);
    const correct = (reveal?.correctPlayerIds ?? [])
      .map((id) => players.find((p) => p.id === id))
      .map((p) => new Color(p ? playerColor(p.colorIndex) : tokens.color.highlight));
    return { text, settled, highlight, correct };
  }, [reveal, players]);

  // When the current shape started forming, so particles can step back once crisp text takes over.
  const formedAt = useRef<{ key: string; t: number } | null>(null);

  useFrame((s, dt) => {
    const pts = ref.current;
    if (!pts) return;
    clock.current = s.clock.elapsedTime;
    const t = reducedMotion ? 0 : s.clock.elapsedTime;
    const pos = pts.geometry.getAttribute('position') as BufferAttribute;
    const col = pts.geometry.getAttribute('color') as BufferAttribute;
    const p = pos.array as Float32Array;
    const c = col.array as Float32Array;

    const mode = phase === 'reveal' ? 'name' : 'item';
    const target = mode === 'name' ? targets.name : targets.item;
    const formed = target ? target.length / 2 : 0;
    const shapeKey = `${mode}:${formed}`;
    if (formedAt.current?.key !== shapeKey) formedAt.current = { key: shapeKey, t: clock.current };
    const handoffSec = (mode === 'name' ? tokens.duration.reveal : tokens.duration.entrance * 1.1) / 1000;
    const handedOff = reducedMotion || clock.current - formedAt.current.t > handoffSec;
    const locked = phase === 'locked';
    pulses.current = pulses.current.filter((pl) => clock.current - pl.t < PULSE.life);

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      let tx: number, ty: number, tz: number;
      const inShape = i < formed && target;
      if (inShape) {
        tx = (target[i * 2] ?? 0) * pxToWorld;
        ty = -(target[i * 2 + 1] ?? 0) * pxToWorld;
        tz = 0;
      } else {
        const hx = home[ix] ?? 0;
        const hy = home[ix + 1] ?? 0;
        const hz = home[ix + 2] ?? 0;
        // Slow noise drift; snaps to a lattice while locked.
        tx = hx + Math.sin(t * 0.3 + hy * 0.8) * 0.4;
        ty = hy + Math.cos(t * 0.25 + hx * 0.6) * 0.3;
        tz = hz;
        if (locked) {
          tx = Math.round(hx / GRID) * GRID;
          ty = Math.round(hy / GRID) * GRID;
        }
      }
      const k = reducedMotion ? 1 : 1 - Math.exp(-(speed[i] ?? 2) * dt);
      p[ix] = (p[ix] ?? 0) + (tx - (p[ix] ?? 0)) * k;
      p[ix + 1] = (p[ix + 1] ?? 0) + (ty - (p[ix + 1] ?? 0)) * k;
      p[ix + 2] = (p[ix + 2] ?? 0) + (tz - (p[ix + 2] ?? 0)) * k;

      // Color: shape particles take the text / reveal colors, the field keeps its own.
      let r = base[ix] ?? 0;
      let g = base[ix + 1] ?? 0;
      let b = base[ix + 2] ?? 0;
      if (inShape) {
        const live = mode === 'name' ? (i % 5 === 0 && colors.correct.length ? colors.correct[i % colors.correct.length] : colors.highlight) : colors.text;
        const tc = handedOff ? colors.settled : live;
        if (tc) ({ r, g, b } = tc);
      }
      for (const pl of pulses.current) {
        const d = Math.hypot((p[ix] ?? 0) - pl.x, (p[ix + 1] ?? 0) - pl.y);
        const ring = (clock.current - pl.t) * PULSE.speed;
        if (Math.abs(d - ring) < PULSE.width) {
          r = colors.highlight.r;
          g = colors.highlight.g;
          b = colors.highlight.b;
        }
      }
      c[ix] = (c[ix] ?? 0) + (r - (c[ix] ?? 0)) * 0.15;
      c[ix + 1] = (c[ix + 1] ?? 0) + (g - (c[ix + 1] ?? 0)) * 0.15;
      c[ix + 2] = (c[ix + 2] ?? 0) + (b - (c[ix + 2] ?? 0)) * 0.15;
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={tokens.scene.particleSize}
        sizeAttenuation={false}
        vertexColors
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

/** Re-samples `el` into particle targets whenever `key` changes (after fonts load). */
function useSampledTargets(el: HTMLElement | null, key: string | null): Float32Array | null {
  const [pts, setPts] = useState<Float32Array | null>(null);
  useLayoutEffect(() => {
    if (!el || key === null) {
      setPts(null);
      return;
    }
    let live = true;
    const sample = () => live && setPts(sampleElementText(el, MAX_TEXT));
    void document.fonts.ready.then(sample);
    window.addEventListener('resize', sample);
    return () => {
      live = false;
      window.removeEventListener('resize', sample);
    };
  }, [el, key]);
  return pts;
}

export default function SignalScene(props: SceneProps) {
  const { phase, item, copy, reveal, players, reducedMotion } = props;
  const owner = players.find((p) => p.id === reveal?.ownerId);
  const [itemEl, setItemEl] = useState<HTMLElement | null>(null);
  const [nameEl, setNameEl] = useState<HTMLElement | null>(null);
  const targets: Targets = {
    item: useSampledTargets(itemEl, item.id),
    name: useSampledTargets(nameEl, owner ? `${item.id}:${owner.id}` : null),
  };
  // Crisp text takes over once the particles have assembled.
  const handoff = { animationDelay: `${reducedMotion ? 0 : tokens.duration.entrance * 1.1}ms` } as CSSProperties;
  const nameHandoff = { animationDelay: `${reducedMotion ? 0 : tokens.duration.reveal}ms` } as CSSProperties;

  return (
    <>
      <SceneCanvas camera={{ position: [0, 0, CAMERA.distance], fov: CAMERA.fov }}>
        <Field {...props} targets={targets} />
      </SceneCanvas>
      <SceneOverlay>
        <div key={item.id} ref={setItemEl} className={phase === 'reveal' ? 'fade-out' : styles.handoff} style={handoff}>
          <ItemText text={item.text} label={`${copy.item} ${item.index + 1}`} />
        </div>
        {phase === 'reveal' && owner && (
          <div className={styles.owner}>
            <p className={`t-label fade-in`} style={nameHandoff}>
              {copy.reveal}
            </p>
            <p ref={setNameEl} className={`t-hero ${styles.handoff}`} style={nameHandoff}>
              {owner.name}
            </p>
          </div>
        )}
      </SceneOverlay>
    </>
  );
}
