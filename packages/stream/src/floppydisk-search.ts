import type { FloppydiskClient } from "./floppydisk-client.js";
import {
  enrichSearchResults,
  searchFixtureAssets,
  type FloppydiskAsset,
} from "./floppydisk-fixtures.js";

/** Embedding search via FloppydiskClient with local fixture fallback. */
export async function searchFloppydiskAssets(
  client: FloppydiskClient,
  query: string,
): Promise<FloppydiskAsset[]> {
  try {
    const results = await client.search(query);
    return enrichSearchResults(results);
  } catch {
    return searchFixtureAssets(query);
  }
}
