import { create } from "zustand";
import { maxArrangementTicks } from "./arrangement-utils.js";

export interface SongMarker {
  id: string;
  tick: number;
  label: string;
}

export interface SessionState {
  sessionName: string;
  tempo: number;
  timeSignature: [number, number];
  isPlaying: boolean;
  positionTicks: number;
  loopStartTick: number | null;
  loopEndTick: number | null;
  markers: SongMarker[];
}

export interface SessionActions {
  setSessionName: (name: string) => void;
  setTempo: (tempo: number) => void;
  setTimeSignature: (ts: [number, number]) => void;
  togglePlay: () => void;
  seekToStart: () => void;
  goToBar: (bar: number) => void;
  stop: () => void;
  setPositionTicks: (tick: number) => void;
  setLoopRegion: (startTick: number, endTick: number) => void;
  clearLoopRegion: () => void;
  addMarker: (tick: number, label?: string) => void;
  removeMarker: (id: string) => void;
  goToPreviousMarker: () => void;
  goToNextMarker: () => void;
  syncFromReconstruction: (
    session: Pick<SessionState, "tempo" | "timeSignature" | "isPlaying" | "positionTicks">,
  ) => void;
}

const defaultMarkers: SongMarker[] = [];

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  sessionName: "Untitled Session",
  tempo: 120,
  timeSignature: [4, 4],
  isPlaying: false,
  positionTicks: 0,
  loopStartTick: null,
  loopEndTick: null,
  markers: defaultMarkers,
  setSessionName: (name) => set({ sessionName: name }),
  setTempo: (tempo) => set({ tempo: Math.max(20, Math.min(999, tempo)) }),
  setTimeSignature: (timeSignature) => set({ timeSignature }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  seekToStart: () => set({ positionTicks: 0 }),
  setPositionTicks: (positionTicks) =>
    set((state) => ({
      positionTicks: Math.max(0, Math.min(positionTicks, maxArrangementTicks(state.tempo))),
    })),
  goToBar: (n) =>
    set((state) => {
      const [numerator, denominator] = state.timeSignature;
      const ticksPerBarValue = 480 * numerator * (4 / denominator);
      const target = Math.max(0, (n - 1) * ticksPerBarValue);
      return {
        positionTicks: Math.min(target, maxArrangementTicks(state.tempo)),
        isPlaying: false,
      };
    }),
  stop: () => set({ isPlaying: false }),
  setLoopRegion: (startTick, endTick) =>
    set((state) => {
      const max = maxArrangementTicks(state.tempo);
      const lo = Math.max(0, Math.min(startTick, endTick));
      const hi = Math.min(max, Math.max(startTick, endTick));
      return { loopStartTick: lo, loopEndTick: hi };
    }),
  clearLoopRegion: () => set({ loopStartTick: null, loopEndTick: null }),
  addMarker: (tick, label) =>
    set((state) => {
      const clamped = Math.max(0, Math.min(tick, maxArrangementTicks(state.tempo)));
      const marker: SongMarker = {
        id: `marker-${Date.now()}`,
        tick: clamped,
        label: label ?? `Marker ${state.markers.length + 1}`,
      };
      return {
        markers: [...state.markers, marker].sort((a, b) => a.tick - b.tick),
      };
    }),
  removeMarker: (id) =>
    set((state) => ({ markers: state.markers.filter((m) => m.id !== id) })),
  goToPreviousMarker: () =>
    set((state) => {
      const stops = [0, ...state.markers.map((m) => m.tick)].sort((a, b) => a - b);
      const prev = [...stops].reverse().find((t) => t < state.positionTicks - 1);
      return { positionTicks: prev ?? 0 };
    }),
  goToNextMarker: () =>
    set((state) => {
      const max = maxArrangementTicks(state.tempo);
      const next = state.markers
        .map((m) => m.tick)
        .sort((a, b) => a - b)
        .find((t) => t > state.positionTicks + 1);
      return { positionTicks: Math.min(next ?? max, max) };
    }),
  syncFromReconstruction: (session) => set(session),
}));
