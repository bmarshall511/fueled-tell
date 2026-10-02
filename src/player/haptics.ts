import { tokens } from '../tokens/tokens';

/** Short haptic ticks on phones that support it (Android; iOS ignores vibrate). */
export const haptics = {
  tap: () => navigator.vibrate?.(tokens.duration.fast / 5),
  lock: () => navigator.vibrate?.(tokens.duration.fast / 3),
  success: () => navigator.vibrate?.(tokens.duration.fast),
};
