import { create } from "zustand";

export interface AnalysisState {
  key: string | null;
  mode: string | null;
  chord: string | null;
  romanNumeral: string | null;
  tension: number;
  confidence: number;
}

export interface AnalysisActions {
  syncFromReconstruction: (analysis: AnalysisState) => void;
}

export const useAnalysisStore = create<AnalysisState & AnalysisActions>((set) => ({
  key: null,
  mode: null,
  chord: null,
  romanNumeral: null,
  tension: 0,
  confidence: 0,
  syncFromReconstruction: (analysis) => set(analysis),
}));
