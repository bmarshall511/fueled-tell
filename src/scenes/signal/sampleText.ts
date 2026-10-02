import { tokens } from '../../tokens/tokens';

/**
 * Samples the rendered glyphs of a DOM element into points, in screen pixels
 * relative to the viewport center. Words are measured from the live layout, so
 * particles land exactly where the crisp HTML text will appear.
 */
export function sampleElementText(el: HTMLElement, maxPoints: number, step = 3): Float32Array {
  const scale = 0.5; // rasterize at half resolution: plenty for particles
  const w = Math.ceil(window.innerWidth * scale);
  const h = Math.ceil(window.innerHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Float32Array();

  // Draw each word at its laid-out position, in the element's own font.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  ctx.fillStyle = tokens.color.text; // raster mask only (alpha is what we read)
  ctx.textBaseline = 'alphabetic';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    const style = getComputedStyle(node.parentElement as Element);
    const fontPx = parseFloat(style.fontSize) * scale;
    ctx.font = `${style.fontWeight} ${fontPx}px ${style.fontFamily}`;
    const re = /\S+/g;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      // Baseline sits roughly 78% down the line box for most Latin faces.
      ctx.fillText(m[0], r.left * scale, (r.top + r.height * 0.78) * scale);
    }
  }

  const data = ctx.getImageData(0, 0, w, h).data;
  const pts: number[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if ((data[(y * w + x) * 4 + 3] ?? 0) > 128) pts.push(x / scale - window.innerWidth / 2, y / scale - window.innerHeight / 2);
    }
  }
  // Thin out evenly if there are too many.
  const count = pts.length / 2;
  const keep = Math.min(count, maxPoints);
  const out = new Float32Array(keep * 2);
  for (let i = 0; i < keep; i++) {
    const src = Math.floor((i * count) / keep) * 2;
    out[i * 2] = pts[src] ?? 0;
    out[i * 2 + 1] = pts[src + 1] ?? 0;
  }
  return out;
}
