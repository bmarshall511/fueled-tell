import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, type CSSProperties } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type Points,
  type Sprite,
  type SpriteMaterial,
} from 'three';
import emblemUrl from '../../../assets/brand/fueled-emblem.svg';
import { tokens } from '../../tokens/tokens';
import { ItemText } from '../../ui/ItemText';
import { playerColor } from '../../ui/playerColor';
import type { SceneProps } from '../Scene';
import { SceneCanvas } from '../SceneCanvas';
import { CAMERA, approach, useStageToWorld } from '../shared/stage';
import { SceneOverlay } from '../shared/SceneOverlay';
import styles from './OrbitScene.module.css';

/** Orbit draws the owner's name on the planet. */
export const rendersOwnerName = true;

/** The active planet comes forward to this depth; orbits sit around z = 0. */
const ACTIVE_Z = 4;
const depthScale = (CAMERA.distance - ACTIVE_Z) / CAMERA.distance;
const ORBIT = { minR: 4.2, stepR: 0.42, squashZ: 0.45, tilt: 0.16, speed: 0.12, planetR: 0.32 };
const MOON = { r: 0.085, orbit: 1.09, speed: 0.6 };
const SPARKS_PER_GUESS = 36;

const ACCENTS = Object.values(tokens.color.player);
const planetColor = (i: number) => ACCENTS[i % ACCENTS.length] ?? tokens.color.accent;

function orbitPosition(i: number, t: number, out: Vector3): Vector3 {
  const r = ORBIT.minR + i * ORBIT.stepR;
  const a = t * ORBIT.speed * (1 - i * 0.06) + i * 2.399; // golden-angle spread
  return out.set(Math.cos(a) * r, Math.sin(a) * r * ORBIT.tilt, Math.sin(a) * r * ORBIT.squashZ);
}

/** Soft radial glow drawn once to a canvas; color comes from tokens. */
function glowTexture(color: string): CanvasTexture {
  {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d') as CanvasRenderingContext2D;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    const n = parseInt(color.slice(1), 16); // token hex, sRGB
    const rgba = (a: number) => `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    g.addColorStop(0, rgba(0.9));
    g.addColorStop(0.45, rgba(0.35));
    g.addColorStop(1, rgba(0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new CanvasTexture(c);
  }
}

const GLOWS = new Map<string, CanvasTexture>();
const glowFor = (color: string) => GLOWS.get(color) ?? GLOWS.set(color, glowTexture(color)).get(color)!;

function Emblem({ reducedMotion }: { reducedMotion: boolean }) {
  const texture = useTexture(emblemUrl);
  const ref = useRef<Mesh>(null);
  useFrame((s) => {
    if (ref.current && !reducedMotion) ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.2) * 0.05;
  });
  return (
    <mesh ref={ref}>
      <circleGeometry args={[1.5, 64]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

interface PlanetsProps extends Pick<SceneProps, 'phase' | 'item' | 'reducedMotion'> {
  activeRadius: number;
  offsetY: number;
}

function Planets({ phase, item, reducedMotion, activeRadius, offsetY }: PlanetsProps) {
  const groups = useRef<(Group | null)[]>([]);
  const halos = useRef<(Sprite | null)[]>([]);
  const tmp = useMemo(() => new Vector3(), []);
  const start = useRef<number | null>(null);

  useFrame((s, dt) => {
    const t = reducedMotion ? 0 : s.clock.elapsedTime;
    start.current ??= t;
    for (let i = 0; i < item.total; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const active = i === item.index;
      const target = active ? tmp.set(0, offsetY, ACTIVE_Z) : orbitPosition(i, t, tmp);
      const lambda = active ? 3 : 2;
      g.position.x = approach(g.position.x, target.x, dt, reducedMotion, lambda);
      g.position.y = approach(g.position.y, target.y, dt, reducedMotion, lambda);
      g.position.z = approach(g.position.z, target.z, dt, reducedMotion, lambda);
      const scale = active ? activeRadius / ORBIT.planetR : i < item.index ? 0.7 : 1;
      g.scale.setScalar(approach(g.scale.x, scale, dt, reducedMotion, lambda));
      const halo = halos.current[i]?.material as SpriteMaterial | undefined;
      if (halo) {
        const glow = active ? (phase === 'locked' ? 0.85 : phase === 'reveal' ? 0.7 : 0.45) : i < item.index ? 0.2 : 0.75;
        halo.opacity = approach(halo.opacity, glow * tokens.scene.glowIntensity, dt, reducedMotion, 4);
      }
    }
  });

  return (
    <>
      {Array.from({ length: item.total }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            groups.current[i] = g;
            if (g && g.userData.placed !== true) {
              g.userData.placed = true;
              orbitPosition(i, 0, g.position);
            }
          }}
        >
          <mesh>
            <sphereGeometry args={[ORBIT.planetR, 48, 32]} />
            <meshStandardMaterial color={tokens.color.neutral[700]} roughness={0.85} />
          </mesh>
          <sprite ref={(m) => void (halos.current[i] = m)} scale={ORBIT.planetR * 3.2} position-z={-ORBIT.planetR}>
            <spriteMaterial map={glowFor(planetColor(i))} transparent opacity={0.4} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
      ))}
    </>
  );
}

interface MoonsProps extends Pick<SceneProps, 'phase' | 'guesses' | 'players' | 'reveal' | 'reducedMotion'> {
  activeRadius: number;
  offsetY: number;
}

/** One moon per guess around the active planet; on reveal, correct moons stream in as sparks. */
function Moons({ phase, guesses, players, reveal, reducedMotion, activeRadius, offsetY }: MoonsProps) {
  const moons = useRef<(Mesh | null)[]>([]);
  const sparks = useRef<Points>(null);
  const revealedAt = useRef<number | null>(null);
  const moonPos = useMemo(() => guesses.map(() => new Vector3()), [guesses]);
  const orbitR = activeRadius * MOON.orbit;

  const correctIdx = guesses.map((g, i) => (reveal?.correctPlayerIds.includes(g.playerId) ? i : -1)).filter((i) => i >= 0);
  const sparkGeo = useMemo(() => {
    const geo = new BufferGeometry();
    const n = Math.max(1, correctIdx.length * SPARKS_PER_GUESS);
    geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    const colors = new Float32Array(n * 3);
    correctIdx.forEach((gi, k) => {
      const p = players.find((pl) => pl.id === guesses[gi]?.playerId);
      const c = new Color(p ? playerColor(p.colorIndex) : tokens.color.highlight);
      for (let j = 0; j < SPARKS_PER_GUESS; j++) c.toArray(colors, (k * SPARKS_PER_GUESS + j) * 3);
    });
    geo.setAttribute('color', new BufferAttribute(colors, 3));
    return geo;
  }, [reveal, guesses.length]);

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    if (phase === 'reveal') revealedAt.current ??= t;
    else revealedAt.current = null;
    const since = revealedAt.current === null ? 0 : t - revealedAt.current;

    guesses.forEach((g, i) => {
      const m = moons.current[i];
      if (!m) return;
      const spin = phase === 'guessing' && !reducedMotion ? t * MOON.speed : 0;
      const a = (i / Math.max(guesses.length, 1)) * Math.PI * 2 + spin;
      const isCorrect = reveal?.correctPlayerIds.includes(g.playerId) ?? false;
      // Wrong guesses drift off into space; correct ones fall into the planet.
      const r = reveal ? (isCorrect ? orbitR * Math.max(0, 1 - since * 0.8) : orbitR * (1 + since * 1.5)) : orbitR;
      moonPos[i]?.set(Math.cos(a) * r, Math.sin(a) * r + offsetY, ACTIVE_Z + 0.2);
      const target = moonPos[i];
      if (!target) return;
      m.position.x = approach(m.position.x, target.x, dt, reducedMotion, 6);
      m.position.y = approach(m.position.y, target.y, dt, reducedMotion, 6);
      m.position.z = target.z;
      const mat = m.material as MeshBasicMaterial;
      const p = players.find((pl) => pl.id === g.playerId);
      mat.color.set(reveal && p ? playerColor(p.colorIndex) : tokens.color.highlight);
    });

    // Sparks: staggered streams from each correct moon's ring position to the planet center.
    const pts = sparks.current;
    if (!pts) return;
    pts.visible = phase === 'reveal' && !reducedMotion;
    if (!pts.visible) return;
    const pos = pts.geometry.getAttribute('position') as BufferAttribute;
    correctIdx.forEach((gi, k) => {
      const a = (gi / Math.max(guesses.length, 1)) * Math.PI * 2;
      for (let j = 0; j < SPARKS_PER_GUESS; j++) {
        const delay = (j / SPARKS_PER_GUESS) * 1.2;
        const p = Math.min(1, Math.max(0, (since - delay) * 1.4));
        const r = orbitR * (1 - p) * (1 + 0.08 * Math.sin(j * 12.9));
        const wobble = 0.12 * Math.sin(j * 7.3 + t * 3);
        pos.setXYZ(k * SPARKS_PER_GUESS + j, Math.cos(a + wobble) * r, Math.sin(a + wobble) * r + offsetY, ACTIVE_Z + 0.3);
      }
    });
    pos.needsUpdate = true;
  });

  return (
    <>
      {guesses.map((g, i) => (
        <mesh
          key={g.playerId}
          ref={(m) => {
            moons.current[i] = m;
            if (m && m.userData.placed !== true) {
              m.userData.placed = true;
              m.position.set(0, offsetY, ACTIVE_Z); // born from the planet
            }
          }}
        >
          <sphereGeometry args={[MOON.r, 24, 16]} />
          <meshBasicMaterial color={tokens.color.highlight} toneMapped={false} />
        </mesh>
      ))}
      <points ref={sparks} geometry={sparkGeo}>
        <pointsMaterial size={tokens.scene.particleSize * 3} sizeAttenuation={false} vertexColors transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
    </>
  );
}

function OrbitWorld(props: SceneProps) {
  const toWorld = useStageToWorld();
  const activeRadius = toWorld(tokens.size.planetRadius) * depthScale;
  const offsetY = -toWorld(tokens.size.itemOffsetY) * depthScale;
  const glow = glowFor(tokens.color.accent);
  return (
    <>
      <ambientLight intensity={tokens.scene.ambientIntensity} />
      <pointLight position={[-3, 4, ACTIVE_Z + 5]} intensity={tokens.scene.lightIntensity} decay={0} color={tokens.color.fueled.techGrey} />
      <directionalLight position={[-4, 6, 8]} intensity={tokens.scene.lightIntensity * 0.6} />
      <sprite scale={[14, 14, 1]} position-z={-1}>
        <spriteMaterial map={glow} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </sprite>
      <Suspense fallback={null}>
        <Emblem reducedMotion={props.reducedMotion} />
      </Suspense>
      <Planets {...props} activeRadius={activeRadius} offsetY={offsetY} />
      <Moons {...props} activeRadius={activeRadius} offsetY={offsetY} />
    </>
  );
}

export default function OrbitScene(props: SceneProps) {
  const { phase, item, copy, reveal, players, reducedMotion } = props;
  const owner = players.find((p) => p.id === reveal?.ownerId);
  const arrive = { animationDelay: `${reducedMotion ? 0 : tokens.duration.entrance}ms` } as CSSProperties;
  const revealDelay = { animationDelay: `${reducedMotion ? 0 : tokens.duration.reveal * 0.5}ms` } as CSSProperties;

  return (
    <>
      <SceneCanvas camera={{ position: [0, 0, CAMERA.distance], fov: CAMERA.fov }}>
        <OrbitWorld {...props} />
      </SceneCanvas>
      <SceneOverlay>
        <div key={item.id} className={`${styles.text} ${phase === 'reveal' ? 'fade-out' : 'fade-in'}`} style={arrive}>
          <ItemText text={item.text} label={`${copy.item} ${item.index + 1}`} scale="body" />
        </div>
        {phase === 'reveal' && owner && (
          <div className={`fade-in ${styles.owner}`} style={revealDelay}>
            <p className="t-label">{copy.reveal}</p>
            <p className="t-display">{owner.name}</p>
          </div>
        )}
      </SceneOverlay>
    </>
  );
}
