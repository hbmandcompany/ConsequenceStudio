import type { FloppydiskAsset, FloppydiskAssetType } from "@consequence/stream";

export type FloppydiskAssetFilter = "all" | FloppydiskAssetType;

export function filterAssetsByType(
  assets: FloppydiskAsset[],
  filter: FloppydiskAssetFilter,
): FloppydiskAsset[] {
  if (filter === "all") return assets;
  return assets.filter((asset) => asset.asset_type === filter);
}

export function formatAssetSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

export const ASSET_TYPE_LABELS: Record<FloppydiskAssetType, string> = {
  midi_fragment: "MIDI",
  sample: "Sample",
  embedding: "Embedding",
  dataset: "Dataset",
};

export const FLOPPYDISK_CARD_HEIGHT = 128;

export const FLOPPYDISK_DRAG_MIME = "application/x-consequence-asset";

export function serializeAssetDragPayload(asset: FloppydiskAsset): string {
  return JSON.stringify({
    asset_id: asset.asset_id,
    name: asset.name,
    asset_type: asset.asset_type,
    preview_notes: asset.preview_notes,
  });
}

export function parseAssetDragPayload(data: string): {
  asset_id: string;
  name: string;
  asset_type: FloppydiskAssetType;
  preview_notes?: FloppydiskAsset["preview_notes"];
} | null {
  try {
    return JSON.parse(data) as {
      asset_id: string;
      name: string;
      asset_type: FloppydiskAssetType;
      preview_notes?: FloppydiskAsset["preview_notes"];
    };
  } catch {
    return null;
  }
}
