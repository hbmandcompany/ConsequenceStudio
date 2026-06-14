import type { AnalysisMotifNote, AnalysisPanelSnapshot, KeyChangeEntry } from "./analysis-panel-types.js";
import type { TheoryAnalysisFrame } from "./theory-types.js";

const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const CONTOUR_SPARKLINES: Record<string, number[]> = {
  ascending: [0.15, 0.3, 0.45, 0.6, 0.75, 0.9],
  descending: [0.9, 0.75, 0.6, 0.45, 0.3, 0.15],
  static: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  arch: [0.2, 0.45, 0.7, 0.85, 0.6, 0.25],
  wave: [0.3, 0.7, 0.4, 0.8, 0.35, 0.65],
};

function chordLabel(frame: TheoryAnalysisFrame): string | null {
  const chord = frame.harmonic_analysis.detected_chord;
  if (!chord) return null;
  if (chord.spelling && !/^\d/.test(chord.spelling)) return chord.spelling;
  return `${PITCH_NAMES[chord.root % 12]}${chord.quality === "major" ? "" : chord.quality}`;
}

function buildMotif(frame: TheoryAnalysisFrame): AnalysisMotifNote[] | null {
  const ghosts = frame.monte_carlo_output?.melodic_ghosts ?? [];
  if (ghosts.length === 0) return null;
  return ghosts.slice(0, 4).map((ghost) => ({
    pitch: ghost.pitch,
    tick: ghost.tick % 960,
    duration: ghost.duration_ticks,
  }));
}

function buildGrooveVector(frame: TheoryAnalysisFrame): number[] {
  const density = frame.melodic_analysis.melodic_density;
  const seed = frame.tick + density * 17;
  return Array.from({ length: 16 }, (_, index) => {
    const wave = (Math.sin((index + seed) * 0.7) + 1) / 2;
    const accent = index % 4 === 0 ? 0.25 : 0;
    return Math.min(1, wave * 0.55 + density * 0.08 + accent);
  });
}

function buildModulationHistory(
  frame: TheoryAnalysisFrame,
  previous: KeyChangeEntry[],
): KeyChangeEntry[] {
  const key = frame.tonality_analysis.estimated_key;
  const label = PITCH_NAMES[key.root % 12];
  const last = previous[previous.length - 1];
  if (last && last.key === label && last.mode === key.mode) return previous;
  return [...previous, { tick: frame.tick, key: label, mode: key.mode }].slice(-8);
}

function progressionConsistency(frame: TheoryAnalysisFrame): number {
  const forecast = frame.progression_forecast ?? [];
  if (forecast.length === 0) return 0;
  const top = forecast[0]?.probability ?? 0;
  const spread = forecast.slice(1, 4).reduce((sum, c) => sum + c.probability, 0);
  return Math.min(1, top + spread * 0.35);
}

function phraseRegularity(frame: TheoryAnalysisFrame, previousPhrase: number | null): number {
  const phrase = frame.melodic_analysis.phrase_length_beats;
  if (phrase == null) return 0.5;
  if (previousPhrase == null) return 0.72;
  const delta = Math.abs(phrase - previousPhrase);
  return Math.max(0.2, 1 - delta * 0.18);
}

/** Project a CMTE AnalysisFrame into the Studio Analysis panel snapshot. */
export function projectAnalysisPanel(
  frame: TheoryAnalysisFrame,
  context: {
    modulation_history?: KeyChangeEntry[];
    previous_phrase_beats?: number | null;
  } = {},
): AnalysisPanelSnapshot {
  const contour = frame.melodic_analysis.melodic_contour.toLowerCase();
  const sparkline =
    CONTOUR_SPARKLINES[contour] ??
    CONTOUR_SPARKLINES.wave;
  const key = frame.tonality_analysis.estimated_key;
  const modulation_history = buildModulationHistory(
    frame,
    context.modulation_history ?? [],
  );

  return {
    frame_id: frame.frame_id,
    tick: frame.tick,
    harmonic: {
      chord: chordLabel(frame),
      roman_numeral: frame.harmonic_analysis.chord_function,
      chord_function: frame.harmonic_analysis.chord_function,
      tension: frame.harmonic_analysis.harmonic_tension,
      pitch_class_set: frame.harmonic_analysis.pitch_class_set,
    },
    melodic: {
      motif: buildMotif(frame),
      contour: frame.melodic_analysis.melodic_contour,
      contour_sparkline: sparkline,
      density: frame.melodic_analysis.melodic_density,
    },
    rhythmic: {
      groove_vector: buildGrooveVector(frame),
      syncopation: Math.min(
        1,
        frame.tonality_analysis.tonal_ambiguity * 0.55 +
          frame.harmonic_analysis.harmonic_tension * 0.45,
      ),
      timing_variance_ms: Math.round(
        frame.melodic_analysis.melodic_density * 9 +
          frame.tonality_analysis.tonal_ambiguity * 22,
      ),
    },
    tonal: {
      key: PITCH_NAMES[key.root % 12],
      mode: key.mode,
      confidence: key.confidence,
      ambiguity: frame.tonality_analysis.tonal_ambiguity,
      modulation_history,
    },
    structural: {
      phrase_length_beats: frame.melodic_analysis.phrase_length_beats,
      phrase_regularity: phraseRegularity(frame, context.previous_phrase_beats ?? null),
      progression_consistency: progressionConsistency(frame),
    },
  };
}
