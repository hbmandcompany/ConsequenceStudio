/** Validates design tokens conform to required schema after Figma sync. */
const REQUIRED_COLOR_KEYS = ["background", "border", "text", "accent"] as const;
const REQUIRED_BG_KEYS = ["canvas", "surface", "elevated", "modal"] as const;

export function validateTokens(tokens: Record<string, unknown>): boolean {
  if (typeof tokens !== "object" || tokens === null) return false;

  const colors = tokens.colors as Record<string, unknown> | undefined;
  if (!colors) return false;

  for (const key of REQUIRED_COLOR_KEYS) {
    if (!(key in colors)) return false;
  }

  const background = colors.background as Record<string, unknown> | undefined;
  if (!background) return false;

  for (const key of REQUIRED_BG_KEYS) {
    if (typeof background[key] !== "string") return false;
  }

  return true;
}
