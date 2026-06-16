import type { FloppydiskClient } from "./floppydisk-client.js";
import { enrichSearchResults, type FloppydiskAsset } from "./floppydisk-fixtures.js";

/** Embedding search via FloppydiskClient — no local fixture fallback. */
export async function searchFloppydiskAssets(
  client: FloppydiskClient,
  query: string,
): Promise<FloppydiskAsset[]> {
  const results = await client.search(query);
  return enrichSearchResults(results);
}
