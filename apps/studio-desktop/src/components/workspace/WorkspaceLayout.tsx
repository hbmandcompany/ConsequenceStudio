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
import {
  UnifiedStream,
  loadStreamConfig,
  collaborationChat,
  collaborationChat2,
  collaborationChat3,
  collaborationChat4,
  collaborationChat5,
  collaborationPresence,
  collaborationPresence2,
  collaborationPresence3,
  doctorDiagnostic,
  doctorSuggestion,
  ledgerUpdate,
  theoryAnalysisFrame,
} from "@consequence/stream";
import { nativeBridge } from "@consequence/native";
import { ResizablePanel, StatusBar, TransportBar, NotificationToast, showNotification } from "@consequence/ui";
import { tokens } from "@consequence/ui/design-system";
import { setWorkspaceStream } from "../../stream/workspace-stream";
import { LeftPanel, RightPanel } from "./SidePanels";
import { CanvasArea } from "./CanvasArea";
import { CommandPaletteHost, useCommandPaletteTrigger } from "./CommandPaletteHost";
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

    let cancelled = false;
    const bootstrapTheory = async () => {
      const cmte = streamSingleton.cmte;
      useTheoryStore.getState().setConnectionStatus("connecting");
      try {
        const caps = await cmte.engineClient.fetchCapabilities();
        const session = await cmte.engineClient.createSession();
        if (cancelled) return;
        useTheoryStore.getState().setSession(session.session_id, caps.version);
        cmte.engineClient.connectStream();
        await new Promise((r) => setTimeout(r, 150));
        await cmte.postEvents([
          { session_id: session.session_id, track_id: "track-1", timestamp_ms: 0, tick: 0, event_type: "note_on", pitch: 60, velocity: 100 },
          { session_id: session.session_id, track_id: "track-1", timestamp_ms: 1, tick: 0, event_type: "note_on", pitch: 64, velocity: 100 },
          { session_id: session.session_id, track_id: "track-1", timestamp_ms: 2, tick: 0, event_type: "note_on", pitch: 67, velocity: 100 },
        ]);
      } catch {
        if (!cancelled) useTheoryStore.getState().setConnectionStatus("disconnected");
      }
    };

    const unsubTheoryStatus = streamSingleton.cmte.onStatus((status) => {
      useTheoryStore.getState().setConnectionStatus(status);
    });

    void bootstrapTheory();

    streamSingleton.emit(doctorDiagnostic);
    streamSingleton.emit(doctorSuggestion);
    streamSingleton.emit(ledgerUpdate);
    streamSingleton.emit(collaborationPresence);
    streamSingleton.emit(collaborationPresence2);
    streamSingleton.emit(collaborationPresence3);
    streamSingleton.emit(collaborationChat);
    streamSingleton.emit(collaborationChat2);
    streamSingleton.emit(collaborationChat3);
    streamSingleton.emit(collaborationChat4);
    streamSingleton.emit(collaborationChat5);
    streamSingleton.cmte.simulateFrame(theoryAnalysisFrame);

    return () => {
      cancelled = true;
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
  const openCommandPalette = useCommandPaletteTrigger();
  const openFloppydiskBrowser = useWorkspaceStore((s) => s.openFloppydiskBrowser);
  const setActiveRightTab = useWorkspaceStore((s) => s.setActiveRightTab);
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
          { label: "CMTE", status: connectionStatus.cmte },
          { label: "Doctor", status: connectionStatus.doctor },
          { label: "Ledger", status: connectionStatus.ledger },
          { label: "Disk", status: connectionStatus.floppydisk },
        ]}
        participantCount={participantCount}
        stakingTier={2}
        stakingTierName="Creator"
        onSessionNameChange={setSessionName}
        onTogglePlay={togglePlay}
        onToggleRecord={toggleRecording}
        onToggleLoop={toggleLoop}
        onSeekToStart={seekToStart}
        onTempoChange={setTempo}
        onTimeSignatureChange={setTimeSignature}
        onCommandPalette={openCommandPalette}
        onFloppydiskBrowser={openFloppydiskBrowser}
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

        <ResizablePanel
          width={rightWidth}
          minWidth={tokens.spacing.rightPanelMinWidth}
          maxWidth={tokens.spacing.rightPanelMaxWidth}
          onWidthChange={setRightWidth}
          edge="left"
        >
          <RightPanel />
        </ResizablePanel>
      </div>

      <StatusBar
        selectedNoteCount={selectedNoteIds.length}
        timeRange="—"
        pitchRange="—"
        quantization={quantization}
        snap={snap}
        key={key}
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
        onPoetStatusClick={() => setActiveRightTab("poet")}
      />
    </div>
  );
}
