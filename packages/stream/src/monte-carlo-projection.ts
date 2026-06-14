import type {
  ChordPath,
  GravityArrow,
  MelodicGhost,
  MonteCarloOutput,
  PossibilityBar,
  TheoryAnalysisFrame,
  TheoryProgressionCandidate,
} from "./theory-types.js";
import { buildHarmonicHighlights } from "./harmonic-highlights.js";

const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

function chordLabel(chord: { spelling: string; root: number; quality: string }): string {
  if (chord.spelling && !/^\d/.test(chord.spelling)) return chord.spelling;
  return `${PITCH_NAMES[chord.root % 12]}${chord.quality === "major" ? "" : chord.quality}`;
}

function pathSummary(candidate: TheoryProgressionCandidate): string {
  const first = candidate.chord_sequence[0];
  if (!first) return "—";
  const tail = candidate.chord_sequence.slice(1, 3).map(chordLabel).join(" → ");
  return tail ? `${chordLabel(first)} → ${tail}` : chordLabel(first);
}

function buildChordPaths(forecast: TheoryProgressionCandidate[]): ChordPath[] {
  return forecast.slice(0, 5).map((candidate, pathIndex) => {
    const nodes = candidate.chord_sequence.map((chord, index) => ({
      index,
      chord: chordLabel(chord),
      root: chord.root,
      quality: chord.quality,
      x: index / Math.max(candidate.chord_sequence.length - 1, 1),
      y: 0.15 + (chord.root / 11) * 0.7,
    }));
    return {
      id: `path-${pathIndex}`,
      probability: candidate.probability,
      nodes,
    };
  });
}

function buildPossibilityChart(forecast: TheoryProgressionCandidate[]): PossibilityBar[] {
  return forecast.slice(0, 6).map((candidate, index) => ({
    label: pathSummary(candidate) || `Path ${index + 1}`,
    probability: candidate.probability,
  }));
}

function buildMelodicGhosts(frame: TheoryAnalysisFrame): MelodicGhost[] {
  const tick = frame.tick;
  const ghosts: MelodicGhost[] = [];
  const top = frame.progression_forecast[0];
  if (top?.chord_sequence[0]) {
    const next = top.chord_sequence[0];
    ghosts.push({
      pitch: 60 + next.root,
      tick: tick + 480,
      duration_ticks: 480,
      velocity: 72,
      confidence: top.probability,
    });
    if (top.chord_sequence[1]) {
      const second = top.chord_sequence[1];
      ghosts.push({
        pitch: 60 + second.root,
        tick: tick + 960,
        duration_ticks: 480,
        velocity: 64,
        confidence: top.probability * 0.75,
      });
    }
  }
  if (frame.melodic_analysis.phrase_length_beats) {
    ghosts.push({
      pitch: 67,
      tick: tick + Math.round(frame.melodic_analysis.phrase_length_beats * 480),
      duration_ticks: 240,
      velocity: 56,
      confidence: frame.tonality_analysis.estimated_key.confidence,
    });
  }
  return ghosts;
}

function buildGravityArrows(frame: TheoryAnalysisFrame): GravityArrow[] {
  const current = frame.harmonic_analysis.detected_chord;
  if (!current) return [];
  const fromX = 0.08;
  const fromY = 0.15 + (current.root / 11) * 0.7;
  return frame.progression_forecast.slice(0, 4).map((candidate, index) => {
    const target = candidate.chord_sequence[0] ?? current;
    const toX = 0.35 + index * 0.14;
    const toY = 0.15 + (target.root / 11) * 0.7;
    return {
      from_x: fromX,
      from_y: fromY,
      to_x: toX,
      to_y: toY,
      strength: candidate.probability,
      label: chordLabel(target),
    };
  });
}

/** Project a CMTE AnalysisFrame into Studio monte_carlo_output visualization data. */
export function projectMonteCarloOutput(frame: TheoryAnalysisFrame): MonteCarloOutput {
  const forecast = frame.progression_forecast ?? [];
  const current = frame.harmonic_analysis.detected_chord;
  return {
    chord_paths: buildChordPaths(forecast),
    melodic_ghosts: buildMelodicGhosts(frame),
    possibility_chart: buildPossibilityChart(forecast),
    gravity_arrows: buildGravityArrows(frame),
    current_chord: current ? chordLabel(current) : null,
    tick: frame.tick,
    harmonic_highlights: buildHarmonicHighlights(frame),
  };
}

/** Attach monte_carlo_output to a frame if the engine did not include it. */
export function enrichAnalysisFrame(frame: TheoryAnalysisFrame): TheoryAnalysisFrame {
  return {
    ...frame,
    monte_carlo_output: frame.monte_carlo_output ?? projectMonteCarloOutput(frame),
  };
}
