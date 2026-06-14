import { create } from "zustand";

export type RightPanelTab = "doctor" | "analysis" | "ledger" | "collab" | "poet";

export interface WorkspaceState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  trackListRatio: number;
  arrangementRatio: number;
  activeRightTab: RightPanelTab;
  previousRightTab: RightPanelTab | null;
  streamLatencyMs: number;
  isRecording: boolean;
  loopEnabled: boolean;
  quantization: string;
  snap: string;
  commandPaletteOpen: boolean;
  pianoRollVisible: boolean;
  floppydiskBrowserOpen: boolean;
}

export interface WorkspaceActions {
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setTrackListRatio: (ratio: number) => void;
  setArrangementRatio: (ratio: number) => void;
  setActiveRightTab: (tab: RightPanelTab) => void;
  setPreviousRightTab: (tab: RightPanelTab | null) => void;
  setStreamLatencyMs: (ms: number) => void;
  toggleRecording: () => void;
  toggleLoop: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  togglePianoRollVisible: () => void;
  openFloppydiskBrowser: () => void;
  closeFloppydiskBrowser: () => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set) => ({
  leftPanelWidth: 260,
  rightPanelWidth: 320,
  trackListRatio: 0.67,
  arrangementRatio: 0.6,
  activeRightTab: "doctor",
  previousRightTab: null,
  streamLatencyMs: 0,
  isRecording: false,
  loopEnabled: false,
  quantization: "1/16",
  snap: "Grid",
  commandPaletteOpen: false,
  pianoRollVisible: true,
  floppydiskBrowserOpen: false,
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
  setTrackListRatio: (ratio) => set({ trackListRatio: ratio }),
  setArrangementRatio: (ratio) => set({ arrangementRatio: ratio }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  setPreviousRightTab: (tab) => set({ previousRightTab: tab }),
  setStreamLatencyMs: (ms) => set({ streamLatencyMs: ms }),
  toggleRecording: () => set((s) => ({ isRecording: !s.isRecording })),
  toggleLoop: () => set((s) => ({ loopEnabled: !s.loopEnabled })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  togglePianoRollVisible: () => set((s) => ({ pianoRollVisible: !s.pianoRollVisible })),
  openFloppydiskBrowser: () => set({ floppydiskBrowserOpen: true }),
  closeFloppydiskBrowser: () => set({ floppydiskBrowserOpen: false }),
}));
