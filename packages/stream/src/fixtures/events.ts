import type { UnifiedStreamEvent } from "../types.js";

export const transportEvent: UnifiedStreamEvent = {
  event_type: "transport_state_event",
  payload: {
    is_playing: true,
    tempo: 128,
    time_signature: [4, 4],
    position_ticks: 1920,
  },
};

export const midiNoteEvent: UnifiedStreamEvent = {
  event_type: "midi_note_event",
  payload: {
    note_id: "note-1",
    pitch: 60,
    velocity: 100,
    tick: 0,
    duration: 480,
    track_id: "track-1",
    action: "on",
  },
};

export const cmteFrame: UnifiedStreamEvent = {
  event_type: "cmte_analysis_frame",
  payload: {
    key: "C",
    mode: "major",
    chord: "Cmaj7",
    roman_numeral: "I",
    tension: 0.2,
    confidence: 0.92,
    tonal_ambiguity: 0.08,
  },
};

export const doctorDiagnostic: UnifiedStreamEvent = {
  event_type: "doctor_diagnostic_event",
  payload: {
    id: "diag-1",
    severity: "warning",
    headline: "Parallel fifths between voice 1 and voice 3 at bar 4 beat 2",
    explanation: "Two voices move in parallel perfect fifths.",
    category: "harmonic",
    resolved: false,
    bar: 4,
    beat: 2,
  },
};

export const doctorSuggestion: UnifiedStreamEvent = {
  event_type: "doctor_suggestion_event",
  payload: {
    id: "sug-1",
    headline: "Resolve parallel fifths with contrary motion",
    explanation: "Move the upper voice down by step.",
    preview_note_ids: ["ghost-1"],
    ghost_notes: [{ pitch: 67, tick: 1920, duration: 480, velocity: 80 }],
  },
};

export const ledgerUpdate: UnifiedStreamEvent = {
  event_type: "ledger_update_event",
  payload: {
    projected_earnings_usdc: 12.45,
    cmte_contribution_score: 0.78,
    asset_valuation: 4.2,
    market_adjustment: 1.05,
    ai_compute_cost: -0.32,
    storage_cost: -0.08,
    staking: {
      tier: 3,
      tier_name: "Studio",
      stake_multiplier: 1.6,
      discovery_placement_weight: 0.85,
      promotional_slots: 4,
    },
    settlements: [
      { date: "2026-06-12", gross_usdc: 18.2, deductions_usdc: 2.1, net_usdc: 16.1 },
      { date: "2026-06-08", gross_usdc: 9.4, deductions_usdc: 1.2, net_usdc: 8.2 },
      { date: "2026-06-01", gross_usdc: 6.8, deductions_usdc: 0.9, net_usdc: 5.9 },
    ],
    market_history_24h: [
      1.01, 1.02, 1.0, 0.99, 1.03, 1.04, 1.02, 1.05, 1.06, 1.04,
      1.03, 1.05, 1.07, 1.06, 1.05, 1.04, 1.03, 1.05, 1.06, 1.05,
      1.04, 1.05, 1.05, 1.05,
    ],
  },
};

export const collaborationPresence: UnifiedStreamEvent = {
  event_type: "collaboration_presence_event",
  payload: {
    user_id: "user-2",
    name: "Alex",
    activity: "editing",
    cursor_color: "#3A5A7A",
    online: true,
  },
};

export const collaborationPresence2: UnifiedStreamEvent = {
  event_type: "collaboration_presence_event",
  payload: {
    user_id: "user-3",
    name: "Jordan",
    activity: "playing",
    cursor_color: "#5A3A7A",
    online: true,
  },
};

export const collaborationPresence3: UnifiedStreamEvent = {
  event_type: "collaboration_presence_event",
  payload: {
    user_id: "user-4",
    name: "Sam",
    activity: "idle",
    cursor_color: "#4A7A4A",
    online: true,
  },
};

export const collaborationChat: UnifiedStreamEvent = {
  event_type: "collaboration_chat_event",
  payload: {
    message_id: "msg-1",
    user_id: "user-2",
    author: "Alex",
    text: "Check the bridge section",
    timestamp: 1718380800000,
  },
};

export const collaborationChat2: UnifiedStreamEvent = {
  event_type: "collaboration_chat_event",
  payload: {
    message_id: "msg-2",
    user_id: "user-3",
    author: "Jordan",
    text: "I'll add a counter-melody on track 2",
    timestamp: 1718380860000,
  },
};

export const collaborationChat3: UnifiedStreamEvent = {
  event_type: "collaboration_chat_event",
  payload: {
    message_id: "msg-3",
    user_id: "user-4",
    author: "Sam",
    text: "Bridge chords feel tight — Doctor flagged parallel fifths",
    timestamp: 1718380920000,
  },
};

export const collaborationChat4: UnifiedStreamEvent = {
  event_type: "collaboration_chat_event",
  payload: {
    message_id: "msg-4",
    user_id: "user-2",
    author: "Alex",
    text: "Previewing Doctor suggestion now",
    timestamp: 1718380980000,
  },
};

export const collaborationChat5: UnifiedStreamEvent = {
  event_type: "collaboration_chat_event",
  payload: {
    message_id: "msg-5",
    user_id: "user-3",
    author: "Jordan",
    text: "Sounds good — keep the dominant pedal through bar 8",
    timestamp: 1718381040000,
  },
};

export const allFixtureEvents: UnifiedStreamEvent[] = [
  transportEvent,
  midiNoteEvent,
  cmteFrame,
  doctorDiagnostic,
  doctorSuggestion,
  ledgerUpdate,
  collaborationPresence,
  collaborationPresence2,
  collaborationPresence3,
  collaborationChat,
  collaborationChat2,
  collaborationChat3,
  collaborationChat4,
  collaborationChat5,
];
