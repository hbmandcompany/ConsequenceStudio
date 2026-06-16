import { create } from "zustand";
import { clampPixelsPerBar, TICKS_PER_BEAT } from "./arrangement-utils.js";

export interface ClipNote {
  pitch: number;
  tick: number;
  duration: number;
}

export interface ArrangementClip {
  id: string;
  trackId: string;
  name: string;
  startTick: number;
  durationTicks: number;
  notes: ClipNote[];
}

export interface ArrangementState {
  clips: ArrangementClip[];
  selectedClipIds: string[];
  scrollX: number;
  pixelsPerBar: number;
}

export interface ArrangementActions {
  setScrollX: (scrollX: number) => void;
  setPixelsPerBar: (pixelsPerBar: number, viewportWidth?: number) => void;
  selectClips: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  moveClip: (id: string, startTick: number) => void;
  resizeClip: (id: string, durationTicks: number) => void;
  duplicateClip: (id: string, startTick: number) => void;
  addClip: (clip: ArrangementClip) => void;
}


export const useArrangementStore = create<ArrangementState & ArrangementActions>((set) => ({
  clips: [],
  selectedClipIds: [],
  scrollX: 0,
  pixelsPerBar: 120,
  setScrollX: (scrollX) => set({ scrollX: Math.max(0, scrollX) }),
  setPixelsPerBar: (pixelsPerBar, viewportWidth) =>
    set({
      pixelsPerBar: viewportWidth
        ? clampPixelsPerBar(pixelsPerBar, viewportWidth)
        : Math.max(24, Math.min(480, pixelsPerBar)),
    }),
  selectClips: (ids, additive = false) =>
    set((state) => ({
      selectedClipIds: additive
        ? [...new Set([...state.selectedClipIds, ...ids])]
        : ids,
    })),
  clearSelection: () => set({ selectedClipIds: [] }),
  moveClip: (id, startTick) =>
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === id ? { ...c, startTick: Math.max(0, startTick) } : c,
      ),
    })),
  resizeClip: (id, durationTicks) =>
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === id ? { ...c, durationTicks: Math.max(TICKS_PER_BEAT / 4, durationTicks) } : c,
      ),
    })),
  duplicateClip: (id, startTick) =>
    set((state) => {
      const source = state.clips.find((c) => c.id === id);
      if (!source) return state;
      const copy: ArrangementClip = {
        ...source,
        id: `clip-${Date.now()}`,
        startTick: Math.max(0, startTick),
        notes: source.notes.map((n) => ({ ...n })),
      };
      return {
        clips: [...state.clips, copy],
        selectedClipIds: [copy.id],
      };
    }),
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
}));
