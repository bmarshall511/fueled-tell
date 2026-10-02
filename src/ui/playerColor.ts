import { tokens } from '../tokens/tokens';

const PLAYER_COLORS = Object.values(tokens.color.player);
const PLAYER_VARS = Object.keys(tokens.color.player).map((k) => `var(--color-player-${k})`);

/** Resolved color value for Three.js materials. */
export const playerColor = (index: number): string => PLAYER_COLORS[index % PLAYER_COLORS.length] ?? tokens.color.accent;

/** CSS custom property reference, so UI follows live token edits and pack overrides. */
export const playerColorVar = (index: number): string => PLAYER_VARS[index % PLAYER_VARS.length] ?? 'var(--color-accent)';
