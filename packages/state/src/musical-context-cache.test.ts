import { beforeEach, describe, expect, it } from "vitest";
import type { AnalysisPanelSnapshot } from "@consequence/stream";
import { useMusicalContextCache } from "./musical-context-cache.js";

const panel: AnalysisPanelSnapshot = {
  frame_id: "f1",
  tick: 960,
  harmonic: {
    chord: "Cmaj7",
    roman_numeral: "I",
    chord_function: "tonic",
    tension: 0.42,
    pitch_class_set: [0, 4, 7, 11],
  },
  melodic: { motif: null, contour: "Ascending", contour_sparkline: [], density: 0.61 },
  rhythmic: { groove_vector: [], syncopation: 0.2, timing_variance_ms: 4 },
  tonal: {
    key: "C",
    mode: "major",
    confidence: 0.9,
    ambiguity: 0.1,
    modulation_history: [],
  },
  structural: { phrase_length_beats: 8, phrase_regularity: 0.8, progression_consistency: 0.7 },
};

describe("musical-context-cache", () => {
  beforeEach(() => {
    useMusicalContextCache.getState().clear();
  });

  it("caches snapshot from analysis panel", () => {
    useMusicalContextCache.getState().updateFromAnalysisPanel(panel, {
      positionTicks: 960,
      timeSignature: [4, 4],
      tempo: 128,
    });
    const snapshot = useMusicalContextCache.getState().getSnapshotForGeneration();
    expect(snapshot.current_key_root).toBe(0);
    expect(snapshot.is_stale).toBe(false);
    expect(useMusicalContextCache.getState().frameId).toBe("f1");
  });

  it("returns stale fallback when cache empty", () => {
    const snapshot = useMusicalContextCache.getState().getSnapshotForGeneration();
    expect(snapshot.is_stale).toBe(true);
    expect(snapshot.structural_position).toBe("unknown");
  });
});
