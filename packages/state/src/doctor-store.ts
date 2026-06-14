import { create } from "zustand";
import type { DoctorDiagnosticPayload, DoctorSuggestionPayload } from "@consequence/stream";
import type { DoctorPanelMode } from "./doctor-utils.js";
import { barBeatToTick } from "./doctor-utils.js";
import { usePianoRollStore } from "./piano-roll-store.js";
import { useSessionStore } from "./session-store.js";

export interface ExecuteExchange {
  id: string;
  instruction: string;
  response: string;
  timestamp: number;
}

export interface DoctorState {
  diagnostics: DoctorDiagnosticPayload[];
  suggestions: DoctorSuggestionPayload[];
  panelMode: DoctorPanelMode;
  previewedSuggestionIds: string[];
  popoverSuggestionId: string | null;
  dismissedSuggestionIds: string[];
  dismissedDiagnosticIds: string[];
  executeHistory: ExecuteExchange[];
}

export interface DoctorActions {
  syncFromReconstruction: (doctor: Pick<DoctorState, "diagnostics" | "suggestions">) => void;
  setPanelMode: (mode: DoctorPanelMode) => void;
  toggleSuggestionPreview: (suggestionId: string) => void;
  setPopoverSuggestionId: (suggestionId: string | null) => void;
  dismissSuggestion: (suggestionId: string) => void;
  dismissDiagnostic: (diagnosticId: string) => void;
  jumpToDiagnostic: (diagnostic: DoctorDiagnosticPayload) => void;
  appendExecuteExchange: (exchange: ExecuteExchange) => void;
}

const initial: DoctorState = {
  diagnostics: [],
  suggestions: [],
  panelMode: "diagnose",
  previewedSuggestionIds: [],
  popoverSuggestionId: null,
  dismissedSuggestionIds: [],
  dismissedDiagnosticIds: [],
  executeHistory: [],
};

export const useDoctorStore = create<DoctorState & DoctorActions>((set) => ({
  ...initial,
  syncFromReconstruction: (doctor) =>
    set({
      diagnostics: doctor.diagnostics,
      suggestions: doctor.suggestions,
    }),
  setPanelMode: (panelMode) => set({ panelMode }),
  toggleSuggestionPreview: (suggestionId) =>
    set((state) => {
      const active = state.previewedSuggestionIds.includes(suggestionId);
      return {
        previewedSuggestionIds: active
          ? state.previewedSuggestionIds.filter((id) => id !== suggestionId)
          : [...state.previewedSuggestionIds, suggestionId],
        popoverSuggestionId: active ? null : state.popoverSuggestionId,
      };
    }),
  setPopoverSuggestionId: (popoverSuggestionId) => set({ popoverSuggestionId }),
  dismissSuggestion: (suggestionId) =>
    set((state) => ({
      dismissedSuggestionIds: [...state.dismissedSuggestionIds, suggestionId],
      previewedSuggestionIds: state.previewedSuggestionIds.filter((id) => id !== suggestionId),
      popoverSuggestionId:
        state.popoverSuggestionId === suggestionId ? null : state.popoverSuggestionId,
    })),
  dismissDiagnostic: (diagnosticId) =>
    set((state) => ({
      dismissedDiagnosticIds: [...state.dismissedDiagnosticIds, diagnosticId],
    })),
  jumpToDiagnostic: (diagnostic) => {
    const timeSignature = useSessionStore.getState().timeSignature;
    const tick = barBeatToTick(diagnostic.bar, diagnostic.beat, timeSignature);
    const pixelsPerBar = usePianoRollStore.getState().pixelsPerBar;
    const scrollX = Math.max(0, (tick / 480) * (pixelsPerBar / 4) - 80);
    const scrollY = usePianoRollStore.getState().scrollY;
    usePianoRollStore.getState().setScroll(scrollX, scrollY);
  },
  appendExecuteExchange: (exchange) =>
    set((state) => ({
      executeHistory: [exchange, ...state.executeHistory].slice(0, 10),
    })),
}));

export function visibleDiagnostics(state: DoctorState): DoctorDiagnosticPayload[] {
  return state.diagnostics.filter((d) => !state.dismissedDiagnosticIds.includes(d.id));
}

export function visibleSuggestions(state: DoctorState): DoctorSuggestionPayload[] {
  return state.suggestions.filter((s) => !state.dismissedSuggestionIds.includes(s.id));
}

export function previewedSuggestions(state: DoctorState): DoctorSuggestionPayload[] {
  const visible = visibleSuggestions(state);
  return visible.filter((s) => state.previewedSuggestionIds.includes(s.id));
}
