import { create } from "zustand";
import type { AnalysisPanelSnapshot, MonteCarloOutput } from "@consequence/stream";

export interface TheoryState {
  sessionId: string | null;
  engineVersion: string | null;
  connectionStatus: "disconnected" | "connecting" | "connected";
  monteCarlo: MonteCarloOutput | null;
  analysisPanel: AnalysisPanelSnapshot | null;
  lastFrameId: string | null;
  lastTick: number;
}

export interface TheoryActions {
  setSession: (sessionId: string, engineVersion: string | null) => void;
  setConnectionStatus: (status: TheoryState["connectionStatus"]) => void;
  setMonteCarloOutput: (output: MonteCarloOutput, frameId: string, tick: number) => void;
  setAnalysisPanel: (panel: AnalysisPanelSnapshot, frameId: string, tick: number) => void;
  reset: () => void;
}

const initial: TheoryState = {
  sessionId: null,
  engineVersion: null,
  connectionStatus: "disconnected",
  monteCarlo: null,
  analysisPanel: null,
  lastFrameId: null,
  lastTick: 0,
};

export const useTheoryStore = create<TheoryState & TheoryActions>((set) => ({
  ...initial,
  setSession: (sessionId, engineVersion) => set({ sessionId, engineVersion }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setMonteCarloOutput: (monteCarlo, lastFrameId, lastTick) =>
    set({ monteCarlo, lastFrameId, lastTick }),
  setAnalysisPanel: (analysisPanel, lastFrameId, lastTick) =>
    set({ analysisPanel, lastFrameId, lastTick }),
  reset: () => set(initial),
}));
