/**
 * Host sound design, synthesized with Web Audio (no files to load or license).
 * Short and soft by design: it rides along on a Meet tab share, so nothing
 * shrill, nothing long. Muted state persists. Browsers only allow audio after
 * a user gesture; `unlock()` is called from the first key press / click.
 */

const KEY = 'tell:muted';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();

/** Overall level and the musical palette (a bright major pentatonic, in Hz). */
const LEVEL = 0.22;
const NOTES = { c5: 523.25, d5: 587.33, e5: 659.25, g5: 783.99, a5: 880, c6: 1046.5 };

function readMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export const isMuted = () => muted;

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? '1' : '0');
  } catch {
    /* not persisted */
  }
  if (master) master.gain.value = m ? 0 : LEVEL;
}

export function unlock(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : LEVEL;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', peak = 1): void {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(at: number, dur: number, from: number, to: number, peak = 0.6): void {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + at;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + dur * 0.2);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(env).connect(master);
  src.start(t);
}

export const sound = {
  /** A card sliding onto the table. */
  deal: () => noise(0, 0.32, 600, 2400, 0.5),
  /** A chip landing: a short, woody knock. */
  chip: () => {
    tone(320, 0, 0.09, 'triangle', 0.7);
    noise(0, 0.05, 1800, 900, 0.25);
  },
  /** Guesses locked: a low, final thunk. */
  lock: () => {
    tone(140, 0, 0.25, 'sine', 0.9);
    tone(210, 0.02, 0.18, 'triangle', 0.4);
  },
  /** One drumroll tick; `step` 0..n rises in pitch. */
  tick: (step: number) => tone(NOTES.c5 * (1 + step * 0.12), 0, 0.08, 'square', 0.25),
  /** The flip: a swish into a bright chord. */
  flip: () => {
    noise(0, 0.25, 900, 4000, 0.4);
    [NOTES.c5, NOTES.e5, NOTES.g5].forEach((f, i) => tone(f, 0.18 + i * 0.03, 0.7, 'triangle', 0.5));
  },
  /** Finale: a quick rising arpeggio. */
  fanfare: () =>
    [NOTES.c5, NOTES.e5, NOTES.g5, NOTES.c6, NOTES.a5, NOTES.c6].forEach((f, i) =>
      tone(f, i * 0.11, i === 5 ? 0.9 : 0.22, 'triangle', 0.6),
    ),
  /** Someone joined the lobby. */
  join: () => {
    tone(NOTES.g5, 0, 0.12, 'sine', 0.5);
    tone(NOTES.c6, 0.07, 0.18, 'sine', 0.4);
  },
};

/** Drumroll cues for the host's reveal (phones run the drumroll silently). */
export const DRUMROLL_SOUNDS = { onStep: sound.tick, onDone: sound.flip } as const;
