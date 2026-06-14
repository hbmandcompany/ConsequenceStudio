import { create } from "zustand";
import type { PianoRollNote } from "./reconstructed-state.js";
import { snapTick, TICKS_PER_BEAT } from "@consequence/audio";
import { useWorkspaceStore } from "./workspace-store.js";

export type PianoRollTool = "pointer" | "pencil" | "eraser";

export interface PianoRollState {
  notes: PianoRollNote[];
  selectedNoteIds: string[];
  activeTool: PianoRollTool;
  scrollX: number;
  scrollY: number;
  pixelsPerBar: number;
  rowHeight: number;
  activeTrackId: string;
}

export interface PianoRollActions {
  selectNotes: (ids: string[]) => void;
  setActiveTool: (tool: PianoRollTool) => void;
  setScroll: (scrollX: number, scrollY: number) => void;
  setPixelsPerBar: (value: number) => void;
  setRowHeight: (value: number) => void;
  setActiveTrackId: (trackId: string) => void;
  addNote: (note: Omit<PianoRollNote, "id">) => void;
  updateNote: (id: string, patch: Partial<PianoRollNote>) => void;
  deleteNote: (id: string) => void;
  moveNote: (id: string, tick: number, pitch: number) => void;
  resizeNote: (id: string, duration: number) => void;
  syncFromReconstruction: (notes: PianoRollNote[]) => void;
}

const seedNotes: PianoRollNote[] = [
  { id: "n1", pitch: 60, velocity: 100, tick: 0, duration: TICKS_PER_BEAT * 2, trackId: "track-1" },
  { id: "n2", pitch: 64, velocity: 96, tick: 0, duration: TICKS_PER_BEAT * 2, trackId: "track-1" },
  { id: "n3", pitch: 67, velocity: 92, tick: 0, duration: TICKS_PER_BEAT * 2, trackId: "track-1" },
  { id: "n4", pitch: 62, velocity: 88, tick: TICKS_PER_BEAT * 2, duration: TICKS_PER_BEAT * 2, trackId: "track-1" },
  { id: "n5", pitch: 36, velocity: 110, tick: 0, duration: TICKS_PER_BEAT, trackId: "track-2" },
  { id: "n6", pitch: 36, velocity: 105, tick: TICKS_PER_BEAT * 2, duration: TICKS_PER_BEAT, trackId: "track-2" },
  { id: "n7", pitch: 42, velocity: 120, tick: TICKS_PER_BEAT * 4, duration: 120, trackId: "track-3" },
];

export const usePianoRollStore = create<PianoRollState & PianoRollActions>((set) => ({
  notes: seedNotes,
  selectedNoteIds: [],
  activeTool: "pointer",
  scrollX: 0,
  scrollY: (127 - 72) * 12,
  pixelsPerBar: 120,
  rowHeight: 12,
  activeTrackId: "track-1",
  selectNotes: (ids) => set({ selectedNoteIds: ids }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setScroll: (scrollX, scrollY) => set({ scrollX: Math.max(0, scrollX), scrollY: Math.max(0, scrollY) }),
  setPixelsPerBar: (pixelsPerBar) => set({ pixelsPerBar: Math.max(40, Math.min(400, pixelsPerBar)) }),
  setRowHeight: (rowHeight) => set({ rowHeight: Math.max(8, Math.min(24, rowHeight)) }),
  setActiveTrackId: (activeTrackId) => set({ activeTrackId }),
  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, { ...note, id: `note-${Date.now()}` }],
      selectedNoteIds: [],
    })),
  updateNote: (id, patch) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    })),
  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNoteIds: state.selectedNoteIds.filter((nid) => nid !== id),
    })),
  moveNote: (id, tick, pitch) => {
    const quantization = useWorkspaceStore.getState().quantization;
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? {
              ...n,
              tick: snapTick(tick, quantization),
              pitch: Math.max(0, Math.min(127, pitch)),
            }
          : n,
      ),
    }));
  },
  resizeNote: (id, duration) =>
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, duration: Math.max(TICKS_PER_BEAT / 8, duration) } : n,
      ),
    })),
  syncFromReconstruction: (notes) => set({ notes }),
}));
