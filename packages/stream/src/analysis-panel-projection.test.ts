import { describe, it, expect } from "vitest";
import { projectAnalysisPanel } from "./analysis-panel-projection.js";
import { enrichAnalysisFrame } from "./monte-carlo-projection.js";
import { theoryAnalysisFrame } from "./fixtures/theory-frame.js";

describe("projectAnalysisPanel", () => {
  it("builds harmonic, melodic, rhythmic, tonal, and structural sections", () => {
    const frame = enrichAnalysisFrame(theoryAnalysisFrame);
    const panel = projectAnalysisPanel(frame);
    expect(panel.harmonic.chord).toBe("C");
    expect(panel.harmonic.pitch_class_set).toEqual([0, 4, 7]);
    expect(panel.melodic.contour).toBe("ascending");
    expect(panel.melodic.contour_sparkline.length).toBeGreaterThan(0);
    expect(panel.rhythmic.groove_vector).toHaveLength(16);
    expect(panel.tonal.key).toBe("C");
    expect(panel.structural.phrase_length_beats).toBe(1);
  });

  it("appends modulation history when key changes", () => {
    const frame = enrichAnalysisFrame(theoryAnalysisFrame);
    const first = projectAnalysisPanel(frame);
    const second = projectAnalysisPanel(
      {
        ...frame,
        frame_id: "frame-2",
        tick: 480,
        tonality_analysis: {
          estimated_key: { root: 7, mode: "major", confidence: 0.8 },
          tonal_ambiguity: 0.2,
        },
      },
      { modulation_history: first.tonal.modulation_history },
    );
    expect(second.tonal.modulation_history.length).toBe(2);
    expect(second.tonal.modulation_history[1]?.key).toBe("G");
  });
});
