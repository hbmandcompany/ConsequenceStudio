import { describe, it, expect } from "vitest";
import {
  buildHarmonicHighlights,
  harmonicRowRole,
  isPitchClassOutOfKey,
} from "./harmonic-highlights.js";
import { theoryAnalysisFrame } from "./fixtures/theory-frame.js";

describe("buildHarmonicHighlights", () => {
  it("derives tonic, dominant, and diatonic pitch classes from CMTE key estimate", () => {
    const highlights = buildHarmonicHighlights(theoryAnalysisFrame);
    expect(highlights.tonic_pitch_classes).toEqual([0]);
    expect(highlights.dominant_pitch_classes).toEqual([7]);
    expect(highlights.diatonic_pitch_classes).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it("flags out-of-key pitch classes and row roles", () => {
    const highlights = buildHarmonicHighlights(theoryAnalysisFrame);
    expect(isPitchClassOutOfKey(1, highlights)).toBe(true);
    expect(isPitchClassOutOfKey(7, highlights)).toBe(false);
    expect(harmonicRowRole(0, highlights)).toBe("tonic");
    expect(harmonicRowRole(7, highlights)).toBe("dominant");
    expect(harmonicRowRole(2, highlights)).toBe(null);
  });
});
