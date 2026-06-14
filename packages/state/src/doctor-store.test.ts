import { describe, it, expect, beforeEach } from "vitest";
import { doctorDiagnostic, doctorSuggestion } from "@consequence/stream";
import {
  useDoctorStore,
  visibleDiagnostics,
  visibleSuggestions,
  previewedSuggestions,
} from "./doctor-store.js";
import { barBeatToTick } from "./doctor-utils.js";

describe("doctor-store", () => {
  beforeEach(() => {
    useDoctorStore.setState({
      diagnostics: [],
      suggestions: [],
      panelMode: "diagnose",
      previewedSuggestionIds: [],
      popoverSuggestionId: null,
      dismissedSuggestionIds: [],
      dismissedDiagnosticIds: [],
      executeHistory: [],
    });
  });

  it("syncs diagnostics and suggestions from reconstruction", () => {
    if (doctorDiagnostic.event_type !== "doctor_diagnostic_event") throw new Error("fixture");
    if (doctorSuggestion.event_type !== "doctor_suggestion_event") throw new Error("fixture");
    useDoctorStore.getState().syncFromReconstruction({
      diagnostics: [doctorDiagnostic.payload],
      suggestions: [doctorSuggestion.payload],
    });
    expect(useDoctorStore.getState().diagnostics).toHaveLength(1);
    expect(useDoctorStore.getState().suggestions).toHaveLength(1);
  });

  it("toggles suggestion preview and filters dismissed suggestions", () => {
    if (doctorSuggestion.event_type !== "doctor_suggestion_event") throw new Error("fixture");
    useDoctorStore.getState().syncFromReconstruction({
      diagnostics: [],
      suggestions: [doctorSuggestion.payload],
    });
    useDoctorStore.getState().toggleSuggestionPreview("sug-1");
    const state = useDoctorStore.getState();
    expect(previewedSuggestions(state)).toHaveLength(1);
    useDoctorStore.getState().dismissSuggestion("sug-1");
    expect(visibleSuggestions(useDoctorStore.getState())).toHaveLength(0);
  });

  it("filters dismissed diagnostics", () => {
    if (doctorDiagnostic.event_type !== "doctor_diagnostic_event") throw new Error("fixture");
    useDoctorStore.getState().syncFromReconstruction({
      diagnostics: [doctorDiagnostic.payload],
      suggestions: [],
    });
    useDoctorStore.getState().dismissDiagnostic("diag-1");
    expect(visibleDiagnostics(useDoctorStore.getState())).toHaveLength(0);
  });
});

describe("barBeatToTick", () => {
  it("converts bar and beat to MIDI ticks", () => {
    expect(barBeatToTick(1, 1, [4, 4])).toBe(0);
    expect(barBeatToTick(4, 2, [4, 4])).toBe(6240);
  });
});
