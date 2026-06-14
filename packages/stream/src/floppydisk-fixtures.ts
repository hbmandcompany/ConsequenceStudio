import type { AssetSearchResult } from "./floppydisk-client.js";

export type FloppydiskAssetType = "midi_fragment" | "sample" | "embedding" | "dataset";

export interface FloppydiskPreviewNote {
  pitch: number;
  tick: number;
  duration: number;
}

export interface FloppydiskAsset extends AssetSearchResult {
  asset_type: FloppydiskAssetType;
  filecoin_cid: string;
  preview_notes?: FloppydiskPreviewNote[];
  preview_waveform?: number[];
}

const wave = (seed: number, len = 32): number[] =>
  Array.from({ length: len }, (_, i) => {
    const t = i / len;
    return Math.max(0.08, Math.abs(Math.sin((t + seed) * Math.PI * 4) * (0.35 + (seed % 7) * 0.05)));
  });

const midi = (notes: FloppydiskPreviewNote[]): FloppydiskPreviewNote[] => notes;

export const floppydiskFixtureAssets: FloppydiskAsset[] = [
  {
    asset_id: "fd-001",
    name: "Neo-Soul Chord Stack",
    asset_type: "midi_fragment",
    size_bytes: 4_096,
    similarity: 0.97,
    filecoin_cid: "bafyneo1",
    preview_notes: midi([
      { pitch: 60, tick: 0, duration: 480 },
      { pitch: 64, tick: 0, duration: 480 },
      { pitch: 67, tick: 0, duration: 480 },
      { pitch: 71, tick: 480, duration: 480 },
    ]),
  },
  {
    asset_id: "fd-002",
    name: "Detroit Pluck Loop",
    asset_type: "sample",
    size_bytes: 812_032,
    similarity: 0.94,
    filecoin_cid: "bafypluck2",
    preview_waveform: wave(2),
  },
  {
    asset_id: "fd-003",
    name: "Harmonic Tension Embedding",
    asset_type: "embedding",
    size_bytes: 12_288,
    similarity: 0.91,
    filecoin_cid: "bafyembed3",
  },
  {
    asset_id: "fd-004",
    name: "Session Note Corpus v2",
    asset_type: "dataset",
    size_bytes: 48_128_000,
    similarity: 0.89,
    filecoin_cid: "bafydataset4",
  },
  {
    asset_id: "fd-005",
    name: "Walking Bass Figure",
    asset_type: "midi_fragment",
    size_bytes: 2_048,
    similarity: 0.88,
    filecoin_cid: "bafybass5",
    preview_notes: midi([
      { pitch: 36, tick: 0, duration: 240 },
      { pitch: 38, tick: 240, duration: 240 },
      { pitch: 41, tick: 480, duration: 240 },
      { pitch: 43, tick: 720, duration: 240 },
    ]),
  },
  {
    asset_id: "fd-006",
    name: "Tape Hiss Room Tone",
    asset_type: "sample",
    size_bytes: 1_204_800,
    similarity: 0.86,
    filecoin_cid: "bafyroom6",
    preview_waveform: wave(6),
  },
  {
    asset_id: "fd-007",
    name: "Arp Sequence 16th",
    asset_type: "midi_fragment",
    size_bytes: 3_072,
    similarity: 0.85,
    filecoin_cid: "bafyarp7",
    preview_notes: midi([
      { pitch: 72, tick: 0, duration: 120 },
      { pitch: 69, tick: 120, duration: 120 },
      { pitch: 67, tick: 240, duration: 120 },
      { pitch: 65, tick: 360, duration: 120 },
    ]),
  },
  {
    asset_id: "fd-008",
    name: "Kick Transient Pack",
    asset_type: "sample",
    size_bytes: 256_000,
    similarity: 0.84,
    filecoin_cid: "bafykick8",
    preview_waveform: wave(8),
  },
  {
    asset_id: "fd-009",
    name: "Modal Jazz Voicing Set",
    asset_type: "midi_fragment",
    size_bytes: 5_120,
    similarity: 0.83,
    filecoin_cid: "bafymodal9",
    preview_notes: midi([
      { pitch: 57, tick: 0, duration: 960 },
      { pitch: 60, tick: 0, duration: 960 },
      { pitch: 64, tick: 0, duration: 960 },
      { pitch: 71, tick: 0, duration: 960 },
    ]),
  },
  {
    asset_id: "fd-010",
    name: "Chord Progression Embeddings",
    asset_type: "embedding",
    size_bytes: 24_576,
    similarity: 0.82,
    filecoin_cid: "bafychord10",
  },
  {
    asset_id: "fd-011",
    name: "Breakbeat Slice",
    asset_type: "sample",
    size_bytes: 640_000,
    similarity: 0.81,
    filecoin_cid: "bafybreak11",
    preview_waveform: wave(11),
  },
  {
    asset_id: "fd-012",
    name: "Countermelody Fragment",
    asset_type: "midi_fragment",
    size_bytes: 2_560,
    similarity: 0.8,
    filecoin_cid: "bafycounter12",
    preview_notes: midi([
      { pitch: 74, tick: 0, duration: 360 },
      { pitch: 72, tick: 360, duration: 360 },
      { pitch: 69, tick: 720, duration: 360 },
    ]),
  },
  {
    asset_id: "fd-013",
    name: "User MIDI Corpus",
    asset_type: "dataset",
    size_bytes: 96_000_000,
    similarity: 0.79,
    filecoin_cid: "bafycorpus13",
  },
  {
    asset_id: "fd-014",
    name: "Shaker Loop 90bpm",
    asset_type: "sample",
    size_bytes: 420_000,
    similarity: 0.78,
    filecoin_cid: "bafyshake14",
    preview_waveform: wave(14),
  },
  {
    asset_id: "fd-015",
    name: "Pad Swell MIDI",
    asset_type: "midi_fragment",
    size_bytes: 4_608,
    similarity: 0.77,
    filecoin_cid: "bafypad15",
    preview_notes: midi([
      { pitch: 48, tick: 0, duration: 1920 },
      { pitch: 55, tick: 0, duration: 1920 },
      { pitch: 60, tick: 0, duration: 1920 },
    ]),
  },
  {
    asset_id: "fd-016",
    name: "Timbral Similarity Vector",
    asset_type: "embedding",
    size_bytes: 8_192,
    similarity: 0.76,
    filecoin_cid: "bafytimbre16",
  },
  {
    asset_id: "fd-017",
    name: "Snare Layer One-Shot",
    asset_type: "sample",
    size_bytes: 96_000,
    similarity: 0.75,
    filecoin_cid: "bafysnare17",
    preview_waveform: wave(17),
  },
  {
    asset_id: "fd-018",
    name: "Funk Guitar Stab",
    asset_type: "midi_fragment",
    size_bytes: 1_536,
    similarity: 0.74,
    filecoin_cid: "bafygtr18",
    preview_notes: midi([
      { pitch: 50, tick: 0, duration: 240 },
      { pitch: 53, tick: 0, duration: 240 },
      { pitch: 58, tick: 0, duration: 240 },
    ]),
  },
  {
    asset_id: "fd-019",
    name: "Marketplace Training Set",
    asset_type: "dataset",
    size_bytes: 210_000_000,
    similarity: 0.73,
    filecoin_cid: "bafymarket19",
  },
  {
    asset_id: "fd-020",
    name: "Vocal Chop Texture",
    asset_type: "sample",
    size_bytes: 1_024_000,
    similarity: 0.72,
    filecoin_cid: "bafyvox20",
    preview_waveform: wave(20),
  },
];

const fixtureById = new Map(floppydiskFixtureAssets.map((asset) => [asset.asset_id, asset]));

export function enrichSearchResults(results: AssetSearchResult[]): FloppydiskAsset[] {
  return results.map((result) => {
    const fixture = fixtureById.get(result.asset_id);
    if (fixture) return { ...fixture, similarity: result.similarity };
    return {
      ...result,
      asset_type: result.asset_type as FloppydiskAssetType,
      filecoin_cid: `bafy${result.asset_id}`,
    };
  });
}

export function searchFixtureAssets(query: string): FloppydiskAsset[] {
  const q = query.trim().toLowerCase();
  const ranked = floppydiskFixtureAssets.map((asset) => {
    const haystack = `${asset.name} ${asset.asset_type}`.toLowerCase();
    const score =
      q.length === 0
        ? asset.similarity
        : haystack.includes(q)
          ? asset.similarity + 0.2
          : q.split(/\s+/).filter((token) => haystack.includes(token)).length * 0.15;
    return { asset, score };
  });
  return ranked
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.asset);
}
