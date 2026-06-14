import { describe, it, expect } from "vitest";
import { useTrackStore } from "./track-store.js";

describe("useTrackStore", () => {
  it("adds and selects tracks", () => {
    const initial = useTrackStore.getState().tracks.length;
    useTrackStore.getState().addTrack("midi");
    expect(useTrackStore.getState().tracks.length).toBe(initial + 1);
    expect(useTrackStore.getState().selectedTrackIds).toHaveLength(1);
  });

  it("toggles mute", () => {
    const id = useTrackStore.getState().tracks[0].id;
    useTrackStore.getState().toggleMute(id);
    expect(useTrackStore.getState().tracks[0].muted).toBe(true);
  });
});
