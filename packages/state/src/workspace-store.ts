import { create } from "zustand";

export type RightPanelTab = "doctor" | "analysis" | "ledger" | "collab" | "poet";

/** Which surface the right-hand dock is currently showing. */
export type RightPanelView = "assistant" | "collab";

/** Context sources the assistant can reference ("weights"). */
export type AssistantContext = "doctor" | "analysis" | "poet" | "ledger";

export const QUANTIZE_VALUES = ["1/4", "1/8", "1/16", "1/16T", "1/32"] as const;
export type QuantizeValue = (typeof QUANTIZE_VALUES)[number];

export interface WorkspaceState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  trackListRatio: number;
  arrangementRatio: number;
  activeRightTab: RightPanelTab;
  previousRightTab: RightPanelTab | null;
  rightPanelOpen: boolean;
  rightPanelView: RightPanelView;
  assistantContext: AssistantContext[];
  streamLatencyMs: number;
  isRecording: boolean;
  loopEnabled: boolean;
  quantization: QuantizeValue;
  snap: string;
  snapEnabled: boolean;
  commandPaletteOpen: boolean;
  pianoRollVisible: boolean;
  pianoRollViewMode: "midi" | "score";
  typingPianoOpen: boolean;
  floppydiskBrowserOpen: boolean;
  instrumentEditorTrackId: string | null;
}

export interface WorkspaceActions {
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setTrackListRatio: (ratio: number) => void;
  setArrangementRatio: (ratio: number) => void;
  setActiveRightTab: (tab: RightPanelTab) => void;
  setPreviousRightTab: (tab: RightPanelTab | null) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelView: (view: RightPanelView) => void;
  showAssistant: () => void;
  showCollab: () => void;
  focusAssistant: (context: AssistantContext) => void;
  toggleAssistantContext: (context: AssistantContext) => void;
  setStreamLatencyMs: (ms: number) => void;
  toggleRecording: () => void;
  toggleLoop: () => void;
  setLoopEnabled: (enabled: boolean) => void;
  setQuantization: (value: QuantizeValue) => void;
  toggleSnap: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  togglePianoRollVisible: () => void;
  setPianoRollViewMode: (mode: "midi" | "score") => void;
  openTypingPiano: () => void;
  closeTypingPiano: () => void;
  openFloppydiskBrowser: () => void;
  closeFloppydiskBrowser: () => void;
  openInstrumentEditor: (trackId: string) => void;
  closeInstrumentEditor: () => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set) => ({
  leftPanelWidth: 260,
  rightPanelWidth: 320,
  trackListRatio: 0.67,
  arrangementRatio: 0.6,
  activeRightTab: "doctor",
  previousRightTab: null,
  rightPanelOpen: true,
  rightPanelView: "assistant",
  assistantContext: ["doctor", "analysis", "poet"],
  streamLatencyMs: 0,
  isRecording: false,
  loopEnabled: false,
  quantization: "1/16",
  snap: "Grid",
  snapEnabled: true,
  commandPaletteOpen: false,
  pianoRollVisible: true,
  pianoRollViewMode: "midi",
  typingPianoOpen: false,
  floppydiskBrowserOpen: false,
  instrumentEditorTrackId: null,
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
  setTrackListRatio: (ratio) => set({ trackListRatio: ratio }),
  setArrangementRatio: (ratio) => set({ arrangementRatio: ratio }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  setPreviousRightTab: (tab) => set({ previousRightTab: tab }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setRightPanelView: (view) => set({ rightPanelView: view }),
  showAssistant: () => set({ rightPanelView: "assistant", rightPanelOpen: true }),
  showCollab: () => set({ rightPanelView: "collab", rightPanelOpen: true }),
  focusAssistant: (context) =>
    set((s) => ({
      rightPanelView: "assistant",
      rightPanelOpen: true,
      assistantContext: s.assistantContext.includes(context)
        ? s.assistantContext
        : [...s.assistantContext, context],
    })),
  toggleAssistantContext: (context) =>
    set((s) => ({
      assistantContext: s.assistantContext.includes(context)
        ? s.assistantContext.filter((c) => c !== context)
        : [...s.assistantContext, context],
    })),
  setStreamLatencyMs: (ms) => set({ streamLatencyMs: ms }),
  toggleRecording: () => set((s) => ({ isRecording: !s.isRecording })),
  toggleLoop: () => set((s) => ({ loopEnabled: !s.loopEnabled })),
  setLoopEnabled: (enabled) => set({ loopEnabled: enabled }),
  setQuantization: (value) => set({ quantization: value }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  togglePianoRollVisible: () => set((s) => ({ pianoRollVisible: !s.pianoRollVisible })),
  setPianoRollViewMode: (mode) => set({ pianoRollViewMode: mode }),
  openTypingPiano: () => set({ typingPianoOpen: true }),
  closeTypingPiano: () => set({ typingPianoOpen: false }),
  openFloppydiskBrowser: () => set({ floppydiskBrowserOpen: true }),
  closeFloppydiskBrowser: () => set({ floppydiskBrowserOpen: false }),
  openInstrumentEditor: (trackId) => set({ instrumentEditorTrackId: trackId }),
  closeInstrumentEditor: () => set({ instrumentEditorTrackId: null }),
}));
