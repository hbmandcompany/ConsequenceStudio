import { create } from "zustand";

export interface SessionState {
  sessionName: string;
  tempo: number;
  timeSignature: [number, number];
  isPlaying: boolean;
  positionTicks: number;
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
  syncFromReconstruction: (session: Pick<SessionState, "tempo" | "timeSignature" | "isPlaying" | "positionTicks">) => void;
}

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  sessionName: "Untitled Session",
  tempo: 120,
  timeSignature: [4, 4],
  isPlaying: false,
  positionTicks: 0,
  setSessionName: (name) => set({ sessionName: name }),
  setTempo: (tempo) => set({ tempo: Math.max(20, Math.min(999, tempo)) }),
  setTimeSignature: (timeSignature) => set({ timeSignature }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  seekToStart: () => set({ positionTicks: 0 }),
  setPositionTicks: (positionTicks) => set({ positionTicks: Math.max(0, positionTicks) }),
  goToBar: (bar) =>
    set((state) => {
      const [numerator, denominator] = state.timeSignature;
      const ticksPerBar = 480 * numerator * (4 / denominator);
      return { positionTicks: Math.max(0, (bar - 1) * ticksPerBar), isPlaying: false };
    }),
  stop: () => set({ isPlaying: false }),
  syncFromReconstruction: (session) => set(session),
}));
