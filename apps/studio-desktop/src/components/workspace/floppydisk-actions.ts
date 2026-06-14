import type { FloppydiskAsset } from "@consequence/stream";
import { searchFloppydiskAssets, searchFixtureAssets } from "@consequence/stream";
import {
  TICKS_PER_BEAT,
  useArrangementStore,
  usePianoRollStore,
  useFloppydiskStore,
} from "@consequence/state";
import { getWorkspaceStream } from "../../stream/workspace-stream.js";

let searchGeneration = 0;

export async function runFloppydiskSearch(query: string): Promise<void> {
  const generation = ++searchGeneration;
  const store = useFloppydiskStore.getState();
  store.setSearching(true);
  store.setSearchError(null);

  const stream = getWorkspaceStream();
  try {
    const results = stream
      ? await searchFloppydiskAssets(stream.floppydisk, query)
      : searchFixtureAssets(query);
    if (generation !== searchGeneration) return;
    store.setResults(results);
  } catch {
    if (generation !== searchGeneration) return;
    store.setSearchError("Search failed");
    store.setResults([]);
  } finally {
    if (generation === searchGeneration) {
      useFloppydiskStore.getState().setSearching(false);
    }
  }
}

export function injectFloppydiskAssetAt(
  asset: Pick<FloppydiskAsset, "asset_id" | "name" | "asset_type" | "preview_notes">,
  target: "arrangement" | "piano-roll",
  position: { tick: number; pitch?: number; trackId?: string },
): void {
  if (target === "arrangement") {
    const trackId = position.trackId ?? "track-1";
    const notes = asset.preview_notes ?? [{ pitch: 60, tick: 0, duration: TICKS_PER_BEAT * 2 }];
    const durationTicks = Math.max(
      TICKS_PER_BEAT * 2,
      ...notes.map((n) => n.tick + n.duration),
    );
    useArrangementStore.getState().addClip({
      id: `clip-${asset.asset_id}-${Date.now()}`,
      trackId,
      name: asset.name,
      startTick: position.tick,
      durationTicks,
      notes: notes.map((n) => ({
        pitch: n.pitch,
        tick: n.tick,
        duration: n.duration,
      })),
    });
    return;
  }

  const trackId = position.trackId ?? usePianoRollStore.getState().activeTrackId;
  const basePitch = position.pitch ?? 60;
  const notes = asset.preview_notes ?? [{ pitch: basePitch, tick: 0, duration: TICKS_PER_BEAT }];
  const addNote = usePianoRollStore.getState().addNote;
  for (const note of notes) {
    addNote({
      pitch: note.pitch,
      velocity: 96,
      tick: position.tick + note.tick,
      duration: note.duration,
      trackId,
    });
  }
}
