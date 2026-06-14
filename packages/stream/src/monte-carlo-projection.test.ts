import { describe, it, expect } from "vitest";
import { projectMonteCarloOutput } from "./monte-carlo-projection.js";
import { theoryAnalysisFrame } from "./fixtures/theory-frame.js";

describe("projectMonteCarloOutput", () => {
  it("builds chord paths and possibility chart from progression forecast", () => {
    const output = projectMonteCarloOutput(theoryAnalysisFrame);
    expect(output.chord_paths.length).toBeGreaterThan(0);
    expect(output.possibility_chart.length).toBeGreaterThan(0);
    expect(output.gravity_arrows.length).toBeGreaterThan(0);
    expect(output.melodic_ghosts.length).toBeGreaterThan(0);
    expect(output.current_chord).toBe("C");
    expect(output.harmonic_highlights.tonic_pitch_classes).toEqual([0]);
    expect(output.harmonic_highlights.dominant_pitch_classes).toEqual([7]);
  });
});
