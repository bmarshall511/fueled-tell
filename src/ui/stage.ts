import { useEffect, useState, type CSSProperties } from 'react';
import { tokens } from '../tokens/tokens';

export type Orientation = 'landscape' | 'portrait';

/**
 * Host layout in reference-stage pixels plus the factor that maps them to the
 * screen. Landscape uses a 1920x1080 stage, portrait (phones, narrow windows)
 * a 1080x1920 one. The HUD and the 3D scenes both read this, so they line up.
 */
export interface StageLayout {
  orientation: Orientation;
  refWidth: number;
  refHeight: number;
  /** Screen px per reference px. */
  scale: number;
  cardWidth: number;
  itemWidth: number;
  itemHeight: number;
  itemOffsetY: number;
}

export function stageFor(width: number, height: number): StageLayout {
  const s = tokens.size;
  const portrait = width / height < 1;
  const refWidth = portrait ? s.stagePortraitWidth : s.stageWidth;
  const refHeight = portrait ? s.stagePortraitHeight : s.stageHeight;
  const cardWidth = portrait ? s.cardWidthPortrait : s.cardWidth;
  return {
    orientation: portrait ? 'portrait' : 'landscape',
    refWidth,
    refHeight,
    scale: Math.min(width / refWidth, height / refHeight),
    cardWidth,
    itemWidth: cardWidth - s.itemPadding * 2,
    itemHeight: portrait ? s.itemHeightPortrait : s.itemHeight,
    itemOffsetY: portrait ? s.itemOffsetYPortrait : s.itemOffsetY,
  };
}

/** CSS custom properties for the HUD and overlays. */
export function stageCssVars(l: StageLayout): CSSProperties {
  return {
    '--stage': l.scale,
    '--stage-w': `${l.refWidth * l.scale}px`,
    '--item-w': `${l.itemWidth * l.scale}px`,
    '--card-w': `${l.cardWidth * l.scale}px`,
    '--item-h': `${l.itemHeight * l.scale}px`,
    '--item-offset': `${l.itemOffsetY * l.scale}px`,
  } as CSSProperties;
}

export function useStageLayout(): StageLayout {
  const [layout, setLayout] = useState(() => stageFor(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const onResize = () => setLayout(stageFor(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return layout;
}
