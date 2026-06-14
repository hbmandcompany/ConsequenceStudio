/** Figma API token sync script — requires FIGMA_ACCESS_TOKEN env var. */
export async function syncTokensFromFigma(): Promise<void> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error("FIGMA_ACCESS_TOKEN is required for token sync");
  }
  // Phase 2+: implement Figma API read and write to packages/ui tokens
}
