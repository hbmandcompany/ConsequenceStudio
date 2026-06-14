import { describe, expect, it } from "vitest";
import { searchFixtureAssets } from "./floppydisk-fixtures.js";

describe("floppydisk fixtures", () => {
  it("returns ranked fixture assets for empty query", () => {
    const results = searchFixtureAssets("");
    expect(results.length).toBeGreaterThan(10);
    expect(results[0]?.similarity).toBeGreaterThanOrEqual(results[1]?.similarity ?? 0);
  });

  it("boosts assets matching search tokens", () => {
    const results = searchFixtureAssets("bass");
    expect(results[0]?.name.toLowerCase()).toContain("bass");
  });
});
