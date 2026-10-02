import { useMemo } from 'react';
import { encodeQr } from './encode';

const QUIET_ZONE = 4;

/** Scannable QR code as inline SVG; sized by its parent (width/height 100%). */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const matrix = useMemo(() => encodeQr(value), [value]);
  const size = matrix.length + QUIET_ZONE * 2;

  const path = useMemo(() => {
    let d = '';
    matrix.forEach((row, y) =>
      row.forEach((dark, x) => {
        if (dark) d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
      }),
    );
    return d;
  }, [matrix]);

  return (
    <svg
      role="img"
      aria-label={label}
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="var(--color-fueled-perfect-white)" />
      <path d={path} fill="var(--color-text-inverse)" />
    </svg>
  );
}
