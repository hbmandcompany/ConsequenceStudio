import { describe, expect, it } from "vitest";
import type { AnalysisPanelSnapshot } from "./analysis-panel-types.js";
import { buildMusicalContextSnapshot } from "./poet-context-builder.js";

const panel: AnalysisPanelSnapshot = {
  frame_id: "f1",
  tick: 1920,
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
    modulation_history: [{ tick: 0, key: "C", mode: "major" }],
  },
  structural: { phrase_length_beats: 8, phrase_regularity: 0.8, progression_consistency: 0.7 },
};

describe("buildMusicalContextSnapshot", () => {
  it("maps analysis panel fields to snapshot", () => {
    const snapshot = buildMusicalContextSnapshot({
      positionTicks: 960,
      timeSignature: [4, 4],
      tempo: 128,
      analysisPanel: panel,
    });
    expect(snapshot.current_key_root).toBe(0);
    expect(snapshot.current_key_mode).toBe("major");
    expect(snapshot.harmonic_tension).toBe(0.42);
    expect(snapshot.rhythmic_density).toBe(0.61);
    expect(snapshot.melodic_contour).toBe("ascending");
    expect(snapshot.is_stale).toBe(false);
    expect(snapshot.tempo_bpm).toBe(128);
  });

  it("returns stale neutral defaults when no analysis frame", () => {
    const snapshot = buildMusicalContextSnapshot({
      positionTicks: 0,
      timeSignature: [4, 4],
      tempo: 120,
      analysisPanel: null,
    });
    expect(snapshot.is_stale).toBe(true);
    expect(snapshot.harmonic_tension).toBe(0.3);
    expect(snapshot.structural_position).toBe("unknown");
  });
});
