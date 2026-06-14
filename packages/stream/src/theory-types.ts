/** Types aligned with Consequence Music Theory Engine (CMTE) schemas. */

export interface TheoryCapabilities {
  status: string;
  version: string;
  endpoints: {
    createSession: string;
    ingestEvents: string;
    stream: string;
    analysis: string;
    health: string;
  };
  auth: "bearer" | "query_token";
  monte_carlo: {
    walks: number;
    walk_length: number;
    top_candidates: number;
  };
}

export interface TheoryChordLabel {
  root: number;
  quality: string;
  bass: number | null;
  inversion: number;
  extensions: number[];
  spelling: string;
}

export interface TheoryKeyEstimate {
  root: number;
  mode: string;
  confidence: number;
}

export interface TheoryProgressionCandidate {
  chord_sequence: TheoryChordLabel[];
  probability: number;
}

export interface TheoryHarmonicAnalysis {
  detected_chord: TheoryChordLabel | null;
  chord_function: string;
  harmonic_tension: number;
  pitch_class_set: number[];
}

export interface TheoryMelodicAnalysis {
  active_voice: string | null;
  melodic_contour: string;
  melodic_density: number;
  phrase_length_beats: number | null;
}

export interface TheoryTonalityAnalysis {
  estimated_key: TheoryKeyEstimate;
  tonal_ambiguity: number;
}

export interface TheoryAnalysisFrame {
  frame_id: string;
  session_id: string;
  timestamp_ms: number;
  tick: number;
  harmonic_analysis: TheoryHarmonicAnalysis;
  melodic_analysis: TheoryMelodicAnalysis;
  tonality_analysis: TheoryTonalityAnalysis;
  progression_forecast: TheoryProgressionCandidate[];
  monte_carlo_output?: MonteCarloOutput;
}

export interface ChordPathNode {
  index: number;
  chord: string;
  root: number;
  quality: string;
  x: number;
  y: number;
}

export interface ChordPath {
  id: string;
  probability: number;
  nodes: ChordPathNode[];
}

export interface MelodicGhost {
  pitch: number;
  tick: number;
  duration_ticks: number;
  velocity: number;
  confidence: number;
}

export interface PossibilityBar {
  label: string;
  probability: number;
}

export interface GravityArrow {
  from_x: number;
  from_y: number;
  to_x: number;
  to_y: number;
  strength: number;
  label: string;
}

/** Harmonic row roles derived from CMTE tonality analysis for piano roll highlighting. */
export interface HarmonicHighlights {
  tonic_pitch_classes: number[];
  dominant_pitch_classes: number[];
  diatonic_pitch_classes: number[];
}

/** Studio visualization payload derived from CMTE progression forecast. */
export interface MonteCarloOutput {
  chord_paths: ChordPath[];
  melodic_ghosts: MelodicGhost[];
  possibility_chart: PossibilityBar[];
  gravity_arrows: GravityArrow[];
  current_chord: string | null;
  tick: number;
  harmonic_highlights: HarmonicHighlights;
}

export interface TheoryMidiInputEvent {
  event_id?: string;
  session_id: string;
  track_id: string;
  user_id?: string;
  timestamp_ms: number;
  tick: number;
  event_type: "note_on" | "note_off" | "control_change" | "program_change" | "tempo_change" | "time_signature" | "pitch_bend";
  pitch?: number;
  velocity?: number;
  channel?: number;
  payload?: Record<string, unknown>;
}

export interface TheorySessionResponse {
  session_id: string;
  created: boolean;
}
