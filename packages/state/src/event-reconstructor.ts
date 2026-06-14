import type { UnifiedStreamEvent } from "@consequence/stream";
import {
  applyMidiNote,
  applyTransportState,
  initialReconstructedState,
  type ReconstructedState,
} from "./reconstructed-state.js";

/** Apply a single event to state — pure reducer step. */
export function applyEvent(state: ReconstructedState, event: UnifiedStreamEvent): ReconstructedState {
  switch (event.event_type) {
    case "transport_state_event":
      return applyTransportState(state, event.payload);

    case "midi_note_event":
      return applyMidiNote(state, event.payload);

    case "cmte_analysis_frame":
      return {
        ...state,
        analysis: {
          key: event.payload.key,
          mode: event.payload.mode,
          chord: event.payload.chord,
          romanNumeral: event.payload.roman_numeral,
          tension: event.payload.tension,
          confidence: event.payload.confidence,
        },
      };

    case "theory_monte_carlo_frame":
      return state;

    case "doctor_diagnostic_event": {
      const existing = state.doctor.diagnostics.findIndex((d) => d.id === event.payload.id);
      const diagnostics = [...state.doctor.diagnostics];
      if (existing >= 0) diagnostics[existing] = event.payload;
      else diagnostics.push(event.payload);
      return { ...state, doctor: { ...state.doctor, diagnostics } };
    }

    case "doctor_suggestion_event": {
      const existing = state.doctor.suggestions.findIndex((s) => s.id === event.payload.id);
      const suggestions = [...state.doctor.suggestions];
      if (existing >= 0) suggestions[existing] = event.payload;
      else suggestions.push(event.payload);
      return { ...state, doctor: { ...state.doctor, suggestions } };
    }

    case "ledger_update_event":
      return { ...state, ledger: event.payload };

    case "collaboration_presence_event": {
      const participants = state.collaboration.participants.filter(
        (p) => p.user_id !== event.payload.user_id,
      );
      if (event.payload.online) participants.push(event.payload);
      return {
        ...state,
        collaboration: { ...state.collaboration, participants },
      };
    }

    case "collaboration_chat_event":
      return {
        ...state,
        collaboration: {
          ...state.collaboration,
          messages: [...state.collaboration.messages, event.payload].slice(-50),
        },
      };

    case "floppydisk_asset_event":
      return state;

    default:
      return state;
  }
}

/** Deterministic state reconstruction from an ordered event log. */
export function reconstructFromEvents(events: UnifiedStreamEvent[]): ReconstructedState {
  return events.reduce(applyEvent, initialReconstructedState());
}

/** Verify that applying events in different group orders yields same result when non-conflicting. */
export function eventsCommute(a: UnifiedStreamEvent, b: UnifiedStreamEvent): boolean {
  const base = initialReconstructedState();
  const ab = applyEvent(applyEvent(base, a), b);
  const ba = applyEvent(applyEvent(base, b), a);
  return JSON.stringify(ab) === JSON.stringify(ba);
}
