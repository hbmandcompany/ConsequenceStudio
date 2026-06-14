import { create } from "zustand";
import type { AnalysisPanelSnapshot } from "@consequence/stream";
import { buildMusicalContextSnapshot, type MusicalContextSnapshot } from "@consequence/stream";

export interface MusicalContextCacheState {
  snapshot: MusicalContextSnapshot | null;
  frameId: string | null;
  tick: number;
  updatedAt: number;
}

export interface MusicalContextCacheActions {
  updateFromAnalysisPanel: (
    panel: AnalysisPanelSnapshot,
    transport: { positionTicks: number; timeSignature: [number, number]; tempo: number },
  ) => void;
  updateFromTransportFallback: (transport: {
    positionTicks: number;
    timeSignature: [number, number];
    tempo: number;
  }) => void;
  getSnapshotForGeneration: () => MusicalContextSnapshot;
  clear: () => void;
}

export const useMusicalContextCache = create<MusicalContextCacheState & MusicalContextCacheActions>(
  (set, get) => ({
    snapshot: null,
    frameId: null,
    tick: 0,
    updatedAt: 0,

    updateFromAnalysisPanel: (panel, transport) => {
      const snapshot = buildMusicalContextSnapshot({
        positionTicks: transport.positionTicks,
        timeSignature: transport.timeSignature,
        tempo: transport.tempo,
        analysisPanel: panel,
      });
      set({
        snapshot,
        frameId: panel.frame_id,
        tick: panel.tick,
        updatedAt: Date.now(),
      });
    },

    updateFromTransportFallback: (transport) => {
      const snapshot = buildMusicalContextSnapshot({
        positionTicks: transport.positionTicks,
        timeSignature: transport.timeSignature,
        tempo: transport.tempo,
        analysisPanel: null,
      });
      set({
        snapshot,
        frameId: null,
        tick: transport.positionTicks,
        updatedAt: Date.now(),
      });
    },

    getSnapshotForGeneration: () => {
      const state = get();
      if (state.snapshot) return state.snapshot;
      return buildMusicalContextSnapshot({
        positionTicks: 0,
        timeSignature: [4, 4],
        tempo: 120,
        analysisPanel: null,
      });
    },

    clear: () => set({ snapshot: null, frameId: null, tick: 0, updatedAt: 0 }),
  }),
);
