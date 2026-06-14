import { create } from "zustand";
import { clampPixelsPerBar, TICKS_PER_BEAT, ticksPerBar } from "./arrangement-utils.js";

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

const defaultClips: ArrangementClip[] = [
  {
    id: "clip-1",
    trackId: "track-1",
    name: "Chords",
    startTick: 0,
    durationTicks: ticksPerBar([4, 4]) * 2,
    notes: [
      { pitch: 60, tick: 0, duration: TICKS_PER_BEAT * 2 },
      { pitch: 64, tick: 0, duration: TICKS_PER_BEAT * 2 },
      { pitch: 67, tick: 0, duration: TICKS_PER_BEAT * 2 },
      { pitch: 62, tick: TICKS_PER_BEAT * 2, duration: TICKS_PER_BEAT * 2 },
      { pitch: 65, tick: TICKS_PER_BEAT * 2, duration: TICKS_PER_BEAT * 2 },
      { pitch: 69, tick: TICKS_PER_BEAT * 2, duration: TICKS_PER_BEAT * 2 },
    ],
  },
  {
    id: "clip-2",
    trackId: "track-2",
    name: "Bass",
    startTick: 0,
    durationTicks: ticksPerBar([4, 4]) * 4,
    notes: [
      { pitch: 36, tick: 0, duration: TICKS_PER_BEAT },
      { pitch: 36, tick: TICKS_PER_BEAT * 2, duration: TICKS_PER_BEAT },
      { pitch: 38, tick: TICKS_PER_BEAT * 4, duration: TICKS_PER_BEAT },
      { pitch: 41, tick: TICKS_PER_BEAT * 6, duration: TICKS_PER_BEAT },
    ],
  },
  {
    id: "clip-3",
    trackId: "track-3",
    name: "Beat",
    startTick: ticksPerBar([4, 4]),
    durationTicks: ticksPerBar([4, 4]),
    notes: [
      { pitch: 42, tick: 0, duration: 120 },
      { pitch: 42, tick: TICKS_PER_BEAT, duration: 120 },
      { pitch: 46, tick: TICKS_PER_BEAT * 2, duration: 120 },
      { pitch: 42, tick: TICKS_PER_BEAT * 3, duration: 120 },
    ],
  },
];

export const useArrangementStore = create<ArrangementState & ArrangementActions>((set) => ({
  clips: defaultClips,
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
