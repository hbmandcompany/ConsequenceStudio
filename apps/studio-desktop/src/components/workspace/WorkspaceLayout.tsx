import { useEffect } from "react";
import {
  bindStoresToStream,
  bindPoetStoreToStream,
  useAnalysisStore,
  useCollaborationStore,
  useLedgerStore,
  usePianoRollStore,
  usePoetStore,
  useSessionStore,
  useSystemStore,
  useWorkspaceStore,
  useTheoryStore,
  getMusicalContextForGeneration,
} from "@consequence/state";
import { UnifiedStream, loadStreamConfig } from "@consequence/stream";
import { nativeBridge } from "@consequence/native";
import { ResizablePanel, StatusBar, TransportBar, NotificationToast, showNotification } from "@consequence/ui";
import { tokens } from "@consequence/ui/design-system";
import { setWorkspaceStream } from "../../stream/workspace-stream";
import { LeftPanel, RightPanel } from "./SidePanels";
import { CanvasArea } from "./CanvasArea";
import { CommandPaletteHost } from "./CommandPaletteHost";
import { FloppydiskBrowser } from "./floppydisk/FloppydiskBrowser";

const streamSingleton = new UnifiedStream(loadStreamConfig(), {
  getMusicalContext: () => getMusicalContextForGeneration(),
  onConnectionState: (state) => usePoetStore.getState().setConnectionState(state),
  onNotification: showNotification,
});
setWorkspaceStream(streamSingleton);

export function useWorkspaceInit() {
  useEffect(() => {
    const unbind = bindStoresToStream(streamSingleton);
    const unbindPoet = bindPoetStoreToStream(streamSingleton);
    streamSingleton.connectAll();
    streamSingleton.connectPoet("studio-session-1");

    const unsubStatus = streamSingleton.onConnectionStatus((status) => {
      useSystemStore.getState().setConnectionStatus(status);
    });

    void nativeBridge.getSystemInfo().then((info) => {
      useSystemStore.getState().setSystemInfo(info);
    });

    const unsubTheoryStatus = streamSingleton.cmte.onStatus((status) => {
      useTheoryStore.getState().setConnectionStatus(status);
      if (status === "connected") {
        const client = streamSingleton.cmte.engineClient;
        const sessionId = client.getSessionId();
        if (sessionId) {
          useTheoryStore.getState().setSession(
            sessionId,
            client.getCapabilities()?.version ?? null,
          );
        }
      }
    });

    return () => {
      unsubTheoryStatus();
      unsubStatus();
      unbindPoet();
      unbind();
      streamSingleton.disconnectAll();
    };
  }, []);
}

export function WorkspaceLayout() {
  useWorkspaceInit();

  const leftWidth = useWorkspaceStore((s) => s.leftPanelWidth);
  const rightWidth = useWorkspaceStore((s) => s.rightPanelWidth);
  const setLeftWidth = useWorkspaceStore((s) => s.setLeftPanelWidth);
  const setRightWidth = useWorkspaceStore((s) => s.setRightPanelWidth);

  const sessionName = useSessionStore((s) => s.sessionName);
  const isPlaying = useSessionStore((s) => s.isPlaying);
  const positionTicks = useSessionStore((s) => s.positionTicks);
  const timeSignature = useSessionStore((s) => s.timeSignature);
  const tempo = useSessionStore((s) => s.tempo);
  const setSessionName = useSessionStore((s) => s.setSessionName);
  const togglePlay = useSessionStore((s) => s.togglePlay);
  const seekToStart = useSessionStore((s) => s.seekToStart);
  const goToPreviousMarker = useSessionStore((s) => s.goToPreviousMarker);
  const goToNextMarker = useSessionStore((s) => s.goToNextMarker);
  const setTempo = useSessionStore((s) => s.setTempo);
  const setTimeSignature = useSessionStore((s) => s.setTimeSignature);

  const isRecording = useWorkspaceStore((s) => s.isRecording);
  const loopEnabled = useWorkspaceStore((s) => s.loopEnabled);
  const toggleRecording = useWorkspaceStore((s) => s.toggleRecording);
  const toggleLoop = useWorkspaceStore((s) => s.toggleLoop);
  const quantization = useWorkspaceStore((s) => s.quantization);
  const snap = useWorkspaceStore((s) => s.snap);
  const streamLatencyMs = useWorkspaceStore((s) => s.streamLatencyMs);

  const connectionStatus = useSystemStore((s) => s.connectionStatus);
  const participantCount = useCollaborationStore((s) => s.participantCount);
  const key = useAnalysisStore((s) => s.key);
  const mode = useAnalysisStore((s) => s.mode);
  const tension = useAnalysisStore((s) => s.tension);
  const projectedEarnings = useLedgerStore((s) => s.projectedEarningsUsdc);
  const selectedNoteIds = usePianoRollStore((s) => s.selectedNoteIds);
  const allNotes = usePianoRollStore((s) => s.notes);
  const rightPanelOpen = useWorkspaceStore((s) => s.rightPanelOpen);
  const rightPanelView = useWorkspaceStore((s) => s.rightPanelView);
  const toggleRightPanel = useWorkspaceStore((s) => s.toggleRightPanel);
  const showAssistant = useWorkspaceStore((s) => s.showAssistant);
  const showCollab = useWorkspaceStore((s) => s.showCollab);
  const focusAssistant = useWorkspaceStore((s) => s.focusAssistant);
  const poetStreaming = usePoetStore((s) => s.is_streaming);
  const poetSupervisionPending = usePoetStore((s) => s.supervision_pending);
  const poetConnected = usePoetStore((s) => s.connection_state === "connected");
  const cpuPercent = 12;
  const memoryPercent = 34;

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ backgroundColor: tokens.colors.background.canvas }}
    >
      <TransportBar
        sessionName={sessionName}
        isPlaying={isPlaying}
        isRecording={isRecording}
        loopEnabled={loopEnabled}
        positionTicks={positionTicks}
        timeSignature={timeSignature}
        tempo={tempo}
        cpuPercent={cpuPercent}
        memoryPercent={memoryPercent}
        connections={[
          { label: "Stream", status: connectionStatus.consequenceStream },
          { label: "Theory", status: connectionStatus.cmte },
          { label: "Ledger", status: connectionStatus.ledger },
          { label: "Disk", status: connectionStatus.floppydisk },
        ]}
        participantCount={participantCount}
        stakingTier={2}
        stakingTierName="Creator"
        assistantOpen={rightPanelOpen && rightPanelView === "assistant"}
        profileInitial={(sessionName.trim()[0] ?? "U").toUpperCase()}
        onSessionNameChange={setSessionName}
        onTogglePlay={togglePlay}
        onToggleRecord={toggleRecording}
        onToggleLoop={toggleLoop}
        onSeekToStart={seekToStart}
        onPreviousMarker={goToPreviousMarker}
        onNextMarker={goToNextMarker}
        onTempoChange={setTempo}
        onTimeSignatureChange={setTimeSignature}
        onOpenCollab={showCollab}
        onToggleAssistant={() => {
          if (rightPanelOpen && rightPanelView === "assistant") {
            toggleRightPanel();
          } else {
            showAssistant();
          }
        }}
      />

      <CommandPaletteHost />
      <NotificationToast />

      <div className="relative flex min-h-0 flex-1">
        <FloppydiskBrowser />
        <ResizablePanel
          width={leftWidth}
          minWidth={tokens.spacing.leftPanelMinWidth}
          maxWidth={tokens.spacing.leftPanelMaxWidth}
          onWidthChange={setLeftWidth}
          edge="right"
        >
          <LeftPanel />
        </ResizablePanel>

        <CanvasArea />

        {rightPanelOpen && (
          <ResizablePanel
            width={rightWidth}
            minWidth={tokens.spacing.rightPanelMinWidth}
            maxWidth={tokens.spacing.rightPanelMaxWidth}
            onWidthChange={setRightWidth}
            edge="left"
          >
            <RightPanel />
          </ResizablePanel>
        )}
      </div>

      <StatusBar
        selectedNoteCount={selectedNoteIds.length}
        selectedNotePitches={allNotes.filter((n) => selectedNoteIds.includes(n.id)).map((n) => n.pitch)}
        selectedNoteTicks={allNotes.filter((n) => selectedNoteIds.includes(n.id)).map((n) => n.tick)}
        quantization={quantization}
        snap={snap}
        tonalKey={key}
        mode={mode}
        tension={tension}
        streamLatencyMs={streamLatencyMs}
        projectedEarningsUsdc={projectedEarnings}
        poetStatus={
          poetStreaming
            ? "streaming"
            : poetSupervisionPending && poetConnected
              ? "review"
              : "idle"
        }
        onPoetStatusClick={() => focusAssistant("poet")}
      />
    </div>
  );
}
