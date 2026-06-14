/** Studio Analysis panel snapshot projected from CMTE frames. */

export interface AnalysisMotifNote {
  pitch: number;
  tick: number;
  duration: number;
}

export interface KeyChangeEntry {
  tick: number;
  key: string;
  mode: string;
}

export interface AnalysisPanelSnapshot {
  frame_id: string;
  tick: number;
  harmonic: {
    chord: string | null;
    roman_numeral: string;
    chord_function: string;
    tension: number;
    pitch_class_set: number[];
  };
  melodic: {
    motif: AnalysisMotifNote[] | null;
    contour: string;
    contour_sparkline: number[];
    density: number;
  };
  rhythmic: {
    groove_vector: number[];
    syncopation: number;
    timing_variance_ms: number;
  };
  tonal: {
    key: string;
    mode: string;
    confidence: number;
    ambiguity: number;
    modulation_history: KeyChangeEntry[];
  };
  structural: {
    phrase_length_beats: number | null;
    phrase_regularity: number;
    progression_consistency: number;
  };
}
