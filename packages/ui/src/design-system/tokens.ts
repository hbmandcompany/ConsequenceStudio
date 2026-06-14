import { animations } from "./animations.js";
import { borderRadius, spacing } from "./spacing.js";
import { colors } from "./colors.js";
import { typography } from "./typography.js";

/** Unified design token object consumed across all packages. */
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  animations,
  borderWidth: "1px",
  poet: {
    accentPrimary: colors.track.violet,
    accentSecondary: colors.track.indigo,
    ghostOpacity: 0.4,
    streamingPulseDurationMs: 1200,
  },
} as const;

export type Tokens = typeof tokens;
