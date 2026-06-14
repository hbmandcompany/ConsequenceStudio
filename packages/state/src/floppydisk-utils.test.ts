import { describe, expect, it } from "vitest";
import { filterAssetsByType, formatAssetSize } from "./floppydisk-utils.js";
import type { FloppydiskAsset } from "@consequence/stream";

const sampleAsset = (type: FloppydiskAsset["asset_type"]): FloppydiskAsset => ({
  asset_id: `id-${type}`,
  name: type,
  asset_type: type,
  size_bytes: 1024,
  similarity: 0.9,
  filecoin_cid: "bafytest",
});

describe("floppydisk-utils", () => {
  it("filters assets by type", () => {
    const assets = [
      sampleAsset("midi_fragment"),
      sampleAsset("sample"),
      sampleAsset("midi_fragment"),
    ];
    expect(filterAssetsByType(assets, "midi_fragment")).toHaveLength(2);
    expect(filterAssetsByType(assets, "all")).toHaveLength(3);
  });

  it("formats byte sizes", () => {
    expect(formatAssetSize(512)).toBe("512 B");
    expect(formatAssetSize(2048)).toBe("2.0 KB");
    expect(formatAssetSize(2_500_000)).toBe("2.5 MB");
  });
});
