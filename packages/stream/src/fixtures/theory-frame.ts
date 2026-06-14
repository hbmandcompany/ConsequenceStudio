import type { TheoryAnalysisFrame } from "../theory-types.js";

/** Minimal CMTE analysis frame fixture for tests. */
export const theoryAnalysisFrame: TheoryAnalysisFrame = {
  frame_id: "frame-test-1",
  session_id: "test-session",
  timestamp_ms: 1000,
  tick: 0,
  harmonic_analysis: {
    detected_chord: {
      root: 0,
      quality: "major",
      bass: null,
      inversion: 0,
      extensions: [],
      spelling: "C",
    },
    chord_function: "tonic",
    harmonic_tension: 0.12,
    pitch_class_set: [0, 4, 7],
  },
  melodic_analysis: {
    active_voice: "track-1",
    melodic_contour: "ascending",
    melodic_density: 2,
    phrase_length_beats: 1,
  },
  tonality_analysis: {
    estimated_key: { root: 0, mode: "major", confidence: 0.88 },
    tonal_ambiguity: 0.1,
  },
  progression_forecast: [
    {
      probability: 0.18,
      chord_sequence: [
        { root: 7, quality: "major", bass: null, inversion: 0, extensions: [], spelling: "G" },
        { root: 0, quality: "major", bass: null, inversion: 0, extensions: [], spelling: "C" },
      ],
    },
    {
      probability: 0.11,
      chord_sequence: [
        { root: 5, quality: "major", bass: null, inversion: 0, extensions: [], spelling: "F" },
        { root: 0, quality: "major", bass: null, inversion: 0, extensions: [], spelling: "C" },
      ],
    },
  ],
};
