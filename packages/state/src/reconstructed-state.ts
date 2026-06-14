import type {
  CollaborationChatPayload,
  CollaborationPresencePayload,
  DoctorDiagnosticPayload,
  DoctorSuggestionPayload,
  LedgerUpdatePayload,
  MidiNotePayload,
  TransportStatePayload,
} from "@consequence/stream";

export interface PianoRollNote {
  id: string;
  pitch: number;
  velocity: number;
  tick: number;
  duration: number;
  trackId: string;
}

export interface ReconstructedState {
  session: {
    tempo: number;
    timeSignature: [number, number];
    isPlaying: boolean;
    positionTicks: number;
  };
  notes: PianoRollNote[];
  analysis: {
    key: string | null;
    mode: string | null;
    chord: string | null;
    romanNumeral: string | null;
    tension: number;
    confidence: number;
  };
  doctor: {
    diagnostics: DoctorDiagnosticPayload[];
    suggestions: DoctorSuggestionPayload[];
  };
  ledger: LedgerUpdatePayload | null;
  collaboration: {
    participants: CollaborationPresencePayload[];
    messages: CollaborationChatPayload[];
  };
}

export const initialReconstructedState = (): ReconstructedState => ({
  session: {
    tempo: 120,
    timeSignature: [4, 4],
    isPlaying: false,
    positionTicks: 0,
  },
  notes: [],
  analysis: {
    key: null,
    mode: null,
    chord: null,
    romanNumeral: null,
    tension: 0,
    confidence: 0,
  },
  doctor: { diagnostics: [], suggestions: [] },
  ledger: null,
  collaboration: { participants: [], messages: [] },
});

export function applyTransportState(
  state: ReconstructedState,
  payload: TransportStatePayload,
): ReconstructedState {
  return {
    ...state,
    session: {
      tempo: payload.tempo,
      timeSignature: payload.time_signature,
      isPlaying: payload.is_playing,
      positionTicks: payload.position_ticks,
    },
  };
}

export function applyMidiNote(
  state: ReconstructedState,
  payload: MidiNotePayload,
): ReconstructedState {
  if (payload.action === "off") {
    return {
      ...state,
      notes: state.notes.filter((n) => n.id !== payload.note_id),
    };
  }

  const note: PianoRollNote = {
    id: payload.note_id,
    pitch: payload.pitch,
    velocity: payload.velocity,
    tick: payload.tick,
    duration: payload.duration,
    trackId: payload.track_id,
  };

  const existing = state.notes.findIndex((n) => n.id === payload.note_id);
  const notes = [...state.notes];
  if (existing >= 0) notes[existing] = note;
  else notes.push(note);

  return { ...state, notes };
}
