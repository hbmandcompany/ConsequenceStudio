import type { HarmonicHighlights, TheoryAnalysisFrame } from "./theory-types.js";

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

/** Build harmonic row highlights from CMTE tonality analysis (no frontend theory). */
export function buildHarmonicHighlights(frame: TheoryAnalysisFrame): HarmonicHighlights {
  const { root, mode } = frame.tonality_analysis.estimated_key;
  const keyRoot = ((root % 12) + 12) % 12;
  const intervals = mode === "minor" ? MINOR_INTERVALS : MAJOR_INTERVALS;
  const diatonic_pitch_classes = intervals.map((interval) => (keyRoot + interval) % 12);
  return {
    tonic_pitch_classes: [keyRoot],
    dominant_pitch_classes: [(keyRoot + 7) % 12],
    diatonic_pitch_classes,
  };
}

export function isPitchClassOutOfKey(pitchClass: number, highlights: HarmonicHighlights): boolean {
  const pc = ((pitchClass % 12) + 12) % 12;
  return !highlights.diatonic_pitch_classes.includes(pc);
}

export function harmonicRowRole(
  pitchClass: number,
  highlights: HarmonicHighlights,
): "tonic" | "dominant" | null {
  const pc = ((pitchClass % 12) + 12) % 12;
  if (highlights.tonic_pitch_classes.includes(pc)) return "tonic";
  if (highlights.dominant_pitch_classes.includes(pc)) return "dominant";
  return null;
}
