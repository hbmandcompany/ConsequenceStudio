import { snapTick } from "@consequence/audio";
import { nativeBridge } from "@consequence/native";
import {
  useArrangementStore,
  useKeymapStore,
  usePianoRollStore,
  usePoetStore,
  useSessionStore,
  useWorkspaceStore,
} from "@consequence/state";
import { ticksPerBar } from "@consequence/state";
import { sendDoctorInstruction } from "./doctor-actions.js";
import {
  generatePoetTarget,
  openPoetConstraints,
  poetPanelActions,
  togglePoetPanelTab,
} from "./poet-actions.js";

export function executeCommand(commandId: string): void {
  switch (commandId) {
    case "transport.play":
      useSessionStore.getState().togglePlay();
      break;
    case "transport.stop":
      useSessionStore.getState().stop();
      break;
    case "transport.record":
      useWorkspaceStore.getState().toggleRecording();
      break;
    case "transport.go-to-bar":
      useSessionStore.getState().goToBar(1);
      break;
    case "edit.select-all": {
      const notes = usePianoRollStore.getState().notes;
      const trackId = usePianoRollStore.getState().activeTrackId;
      const noteIds = notes.filter((n) => n.trackId === trackId).map((n) => n.id);
      usePianoRollStore.getState().selectNotes(noteIds);
      const clips = useArrangementStore.getState().clips;
      useArrangementStore.getState().selectClips(clips.map((c) => c.id));
      break;
    }
    case "edit.deselect":
      usePianoRollStore.getState().selectNotes([]);
      useArrangementStore.getState().clearSelection();
      break;
    case "edit.quantize": {
      const { notes, selectedNoteIds, updateNote } = usePianoRollStore.getState();
      const quantization = useWorkspaceStore.getState().quantization;
      for (const id of selectedNoteIds) {
        const note = notes.find((n) => n.id === id);
        if (!note) continue;
        updateNote(id, { tick: snapTick(note.tick, quantization) });
      }
      break;
    }
    case "edit.duplicate": {
      const piano = usePianoRollStore.getState();
      const session = useSessionStore.getState();
      const offset = ticksPerBar(session.timeSignature);
      if (piano.selectedNoteIds.length > 0) {
        const selected = piano.notes.filter((n) => piano.selectedNoteIds.includes(n.id));
        for (const note of selected) {
          piano.addNote({
            pitch: note.pitch,
            velocity: note.velocity,
            tick: note.tick + offset,
            duration: note.duration,
            trackId: note.trackId,
          });
        }
      }
      const arrangement = useArrangementStore.getState();
      for (const clipId of arrangement.selectedClipIds) {
        const clip = arrangement.clips.find((c) => c.id === clipId);
        if (clip) arrangement.duplicateClip(clipId, clip.startTick + offset);
      }
      break;
    }
    case "view.zoom-in": {
      const arrangement = useArrangementStore.getState();
      const piano = usePianoRollStore.getState();
      arrangement.setPixelsPerBar(arrangement.pixelsPerBar * 1.25);
      piano.setPixelsPerBar(piano.pixelsPerBar * 1.25);
      break;
    }
    case "view.zoom-out": {
      const arrangement = useArrangementStore.getState();
      const piano = usePianoRollStore.getState();
      arrangement.setPixelsPerBar(arrangement.pixelsPerBar / 1.25);
      piano.setPixelsPerBar(piano.pixelsPerBar / 1.25);
      break;
    }
    case "view.toggle-piano-roll":
      useWorkspaceStore.getState().togglePianoRollVisible();
      break;
    case "view.toggle-analysis":
      useWorkspaceStore.getState().focusAssistant("analysis");
      break;
    case "view.toggle-doctor":
      useWorkspaceStore.getState().focusAssistant("doctor");
      break;
    case "view.doctor-compose":
      useWorkspaceStore.getState().focusAssistant("doctor");
      break;
    case "view.keymap-settings":
      useKeymapStore.getState().openSettings();
      break;
    case "session.save":
      void saveSession(false);
      break;
    case "session.save-as":
      void saveSession(true);
      break;
    case "session.open":
      void openSession();
      break;
    case "session.new":
      resetSession();
      break;
    case "consequence.floppydisk":
      useWorkspaceStore.getState().openFloppydiskBrowser();
      break;
    case "consequence.doctor-analyze":
      useWorkspaceStore.getState().focusAssistant("doctor");
      sendDoctorInstruction("Analyze the current session and report harmonic issues.");
      break;
    case "consequence.ledger":
      useWorkspaceStore.getState().focusAssistant("ledger");
      break;
    case "consequence.marketplace":
      useWorkspaceStore.getState().focusAssistant("ledger");
      break;
    case "palette.open":
      useWorkspaceStore.getState().openCommandPalette();
      break;
    case "poet.generate-verse":
      generatePoetTarget("VERSE");
      break;
    case "poet.generate-hook":
      generatePoetTarget("HOOK");
      break;
    case "poet.generate-bridge":
      generatePoetTarget("BRIDGE");
      break;
    case "poet.generate-line":
      generatePoetTarget("LINE");
      break;
    case "poet.accept-all":
      if (usePoetStore.getState().supervision_pending) poetPanelActions.onAcceptAll();
      break;
    case "poet.reject-all":
      if (usePoetStore.getState().supervision_pending) poetPanelActions.onRejectAll();
      break;
    case "poet.new-branch":
      poetPanelActions.onBranchCreate();
      break;
    case "poet.toggle-panel":
      togglePoetPanelTab();
      break;
    case "poet.open-settings":
      openPoetConstraints();
      break;
    default:
      break;
  }
}

async function saveSession(saveAs: boolean): Promise<void> {
  const session = useSessionStore.getState();
  const path =
    (saveAs ? window.prompt("Save project as:", "session.csproj") : "session.csproj") ?? "";
  if (!path) return;
  try {
    await nativeBridge.files.save(
      {
        name: session.sessionName,
        tempo: session.tempo,
        timeSignature: session.timeSignature,
        tracks: [],
      },
      path,
    );
  } catch {
    // Tauri unavailable in browser-only dev — no-op.
  }
}

async function openSession(): Promise<void> {
  const path = window.prompt("Open project:", "session.csproj");
  if (!path) return;
  try {
    const project = await nativeBridge.files.open(path);
    useSessionStore.getState().setSessionName(project.name);
    useSessionStore.getState().setTempo(project.tempo);
    useSessionStore.getState().setTimeSignature(project.timeSignature);
  } catch {
    // Tauri unavailable in browser-only dev — no-op.
  }
}

function resetSession(): void {
  useSessionStore.getState().setSessionName("Untitled Session");
  useSessionStore.getState().setTempo(120);
  useSessionStore.getState().setTimeSignature([4, 4]);
  useSessionStore.getState().stop();
  useSessionStore.getState().seekToStart();
}
