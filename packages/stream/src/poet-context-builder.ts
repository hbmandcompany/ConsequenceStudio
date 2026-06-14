import type { AnalysisPanelSnapshot } from "./analysis-panel-types.js";
import type { MusicalContextSnapshot } from "./poet-types.js";
import { barBeatFromTicks } from "./poet-context-utils.js";

export interface MusicalContextInput {
  positionTicks: number;
  timeSignature: [number, number];
  tempo: number;
  analysisPanel: AnalysisPanelSnapshot | null;
}

const KEY_ROOT: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6,
  G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

const NEUTRAL: MusicalContextSnapshot = {
  current_bar: 1,
  current_beat: 1,
  current_key_root: 0,
  current_key_mode: "major",
  harmonic_tension: 0.3,
  rhythmic_density: 0.5,
  melodic_contour: "flat",
  structural_position: "unknown",
  tempo_bpm: 120,
  time_signature_numerator: 4,
  time_signature_denominator: 4,
  bars_in_current_section: 4,
  is_stale: true,
};

/** Build MusicalContextSnapshot from transport + CMTE analysis panel data. */
export function buildMusicalContextSnapshot(input: MusicalContextInput): MusicalContextSnapshot {
  const { bar, beat } = barBeatFromTicks(input.positionTicks, input.timeSignature);
  const [numerator, denominator] = input.timeSignature;

  if (!input.analysisPanel) {
    return {
      ...NEUTRAL,
      current_bar: bar,
      current_beat: beat,
      tempo_bpm: input.tempo,
      time_signature_numerator: numerator,
      time_signature_denominator: denominator,
    };
  }

  const panel = input.analysisPanel;
  const keyRoot = KEY_ROOT[panel.tonal.key] ?? 0;
  const modulations = panel.tonal.modulation_history;
  const lastModTick = modulations.length > 0 ? modulations[modulations.length - 1]!.tick : 0;
  const ticksPerBar = 480 * numerator * (4 / denominator);
  const barsSinceMod = Math.max(1, Math.floor((panel.tick - lastModTick) / ticksPerBar));

  return {
    current_bar: bar,
    current_beat: beat,
    current_key_root: keyRoot,
    current_key_mode: panel.tonal.mode.toLowerCase(),
    harmonic_tension: panel.harmonic.tension,
    rhythmic_density: panel.melodic.density,
    melodic_contour: panel.melodic.contour.toLowerCase(),
    structural_position: panel.structural.phrase_length_beats ? "phrase" : "unknown",
    tempo_bpm: input.tempo,
    time_signature_numerator: numerator,
    time_signature_denominator: denominator,
    bars_in_current_section: barsSinceMod,
    is_stale: false,
  };
}
