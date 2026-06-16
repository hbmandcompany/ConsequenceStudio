import type { DoctorSuggestionPayload } from "@consequence/stream";
import { getWorkspaceStream } from "../../stream/workspace-stream.js";
import { useDoctorStore, usePianoRollStore } from "@consequence/state";

export function acceptDoctorSuggestion(suggestion: DoctorSuggestionPayload): void {
  const stream = getWorkspaceStream();
  const trackId = usePianoRollStore.getState().activeTrackId;
  const dismiss = useDoctorStore.getState().dismissSuggestion;

  for (const [index, ghost] of suggestion.ghost_notes.entries()) {
    const noteId = `note-${suggestion.id}-${index}-${Date.now()}`;
    stream?.emit({
      event_type: "midi_note_event",
      payload: {
        note_id: noteId,
        pitch: ghost.pitch,
        velocity: ghost.velocity,
        tick: ghost.tick,
        duration: ghost.duration,
        track_id: trackId,
        action: "on",
      },
    });
  }

  dismiss(suggestion.id);
}

export function rejectDoctorSuggestion(suggestionId: string): void {
  getWorkspaceStream()?.doctor.rejectSuggestion(suggestionId);
  useDoctorStore.getState().dismissSuggestion(suggestionId);
}

export function sendDoctorInstruction(instruction: string): void {
  getWorkspaceStream()?.doctor.sendInstruction(instruction);
}
