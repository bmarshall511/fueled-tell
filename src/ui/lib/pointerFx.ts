import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/** How quickly the glow catches up with the pointer each frame (0..1): low feels fluid, high feels glued on. */
const FOLLOW = 0.08;

/**
 * Cursor-reactive effects for mouse users (never touch, never with reduced motion):
 * - `--pointer-x` / `--pointer-y` on <html> (0..1, eased) drive the Backdrop's follow glow and parallax.
 * - Any `.spot` element under the pointer gets `--mx` / `--my` for its spotlight.
 * - `html.pointer-live` is set while the pointer is in the window.
 * One passive listener for the whole app; the eased loop only runs while catching up.
 */
export function startPointerFx(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  let target = { x: 0.5, y: 0.5 };
  let pos = { ...target };
  let frame = 0;

  const tick = () => {
    pos = { x: pos.x + (target.x - pos.x) * FOLLOW, y: pos.y + (target.y - pos.y) * FOLLOW };
    root.style.setProperty('--pointer-x', pos.x.toFixed(4));
    root.style.setProperty('--pointer-y', pos.y.toFixed(4));
    const moving = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.001;
    frame = moving ? requestAnimationFrame(tick) : 0;
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
      target = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
      root.classList.add('pointer-live');
      const spot = e.target instanceof Element ? e.target.closest<HTMLElement>('.spot') : null;
      if (spot) {
        const box = spot.getBoundingClientRect();
        spot.style.setProperty('--mx', `${e.clientX - box.left}px`);
        spot.style.setProperty('--my', `${e.clientY - box.top}px`);
      }
      if (!frame) frame = requestAnimationFrame(tick);
    },
    { passive: true },
  );
  document.addEventListener('mouseleave', () => root.classList.remove('pointer-live'));
}
