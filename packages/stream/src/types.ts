/** Connection lifecycle for all stream clients. */
import type { LedgerSettlement, LedgerStakingInfo } from "./ledger-panel-types.js";
import type { AnalysisPanelSnapshot } from "./analysis-panel-types.js";
import type { MonteCarloOutput } from "./theory-types.js";
import type {
  PoetBackendStatus,
  PoetErrorPayload,
  PoetToken,
  PoetryGenerationEvent,
} from "./poet-types.js";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

/** MIDI note on/off from ConsequenceStream. */
export interface MidiNotePayload {
  note_id: string;
  pitch: number;
  velocity: number;
  tick: number;
  duration: number;
  track_id: string;
  action: "on" | "off" | "update";
}

/** Transport state from ConsequenceStream. */
export interface TransportStatePayload {
  is_playing: boolean;
  tempo: number;
  time_signature: [number, number];
  position_ticks: number;
}

/** CMTE analysis frame from ConsequenceTheory. */
export interface CmteAnalysisPayload {
  key: string;
  mode: string;
  chord: string;
  roman_numeral: string;
  tension: number;
  confidence: number;
  tonal_ambiguity: number;
}

/** Full monte_carlo_output visualization payload from theory engine stream. */
export interface TheoryMonteCarloPayload {
  frame_id: string;
  session_id: string;
  tick: number;
  monte_carlo_output: MonteCarloOutput;
  analysis_panel: AnalysisPanelSnapshot;
  summary: CmteAnalysisPayload;
}

/** ConsequenceDoctor diagnostic. */
export interface DoctorDiagnosticPayload {
  id: string;
  severity: "error" | "warning" | "info";
  headline: string;
  explanation: string;
  category: "harmonic" | "melodic" | "rhythmic" | "structural";
  resolved: boolean;
  bar: number;
  beat: number;
}

/** ConsequenceDoctor suggestion. */
export interface DoctorSuggestionPayload {
  id: string;
  headline: string;
  explanation: string;
  preview_note_ids: string[];
  ghost_notes: Array<{
    pitch: number;
    tick: number;
    duration: number;
    velocity: number;
  }>;
}

/** ConsequenceLedger economic update. */
export interface LedgerUpdatePayload {
  projected_earnings_usdc: number;
  cmte_contribution_score: number;
  asset_valuation: number;
  market_adjustment: number;
  ai_compute_cost: number;
  storage_cost: number;
  staking?: LedgerStakingInfo;
  settlements?: LedgerSettlement[];
  market_history_24h?: number[];
}

/** Floppydisk asset operation result. */
export interface FloppydiskAssetPayload {
  asset_id: string;
  name: string;
  asset_type: "midi_fragment" | "sample" | "embedding" | "dataset";
  size_bytes: number;
  operation: "indexed" | "retrieved" | "stored";
}

/** Collaborator presence from ConsequenceStream. */
export interface CollaborationPresencePayload {
  user_id: string;
  name: string;
  activity: "playing" | "editing" | "idle";
  cursor_color: string;
  online: boolean;
}

/** Chat message from ConsequenceStream. */
export interface CollaborationChatPayload {
  message_id: string;
  user_id: string;
  author: string;
  text: string;
  timestamp: number;
}

/** Discriminated union consumed by all stores and the reconstructor. */
export type UnifiedStreamEvent =
  | { event_type: "midi_note_event"; payload: MidiNotePayload }
  | { event_type: "transport_state_event"; payload: TransportStatePayload }
  | { event_type: "cmte_analysis_frame"; payload: CmteAnalysisPayload }
  | { event_type: "theory_monte_carlo_frame"; payload: TheoryMonteCarloPayload }
  | { event_type: "doctor_diagnostic_event"; payload: DoctorDiagnosticPayload }
  | { event_type: "doctor_suggestion_event"; payload: DoctorSuggestionPayload }
  | { event_type: "ledger_update_event"; payload: LedgerUpdatePayload }
  | { event_type: "floppydisk_asset_event"; payload: FloppydiskAssetPayload }
  | { event_type: "collaboration_presence_event"; payload: CollaborationPresencePayload }
  | { event_type: "collaboration_chat_event"; payload: CollaborationChatPayload }
  | { event_type: "poet_token"; payload: PoetToken }
  | { event_type: "poetry_generation_complete"; payload: PoetryGenerationEvent }
  | { event_type: "poet_backend_status"; payload: PoetBackendStatus }
  | { event_type: "poet_error"; payload: PoetErrorPayload };

export function parseStreamEvent(data: string): UnifiedStreamEvent | null {
  try {
    const parsed = JSON.parse(data) as {
      event_type?: string;
      event_kind?: string;
      payload?: unknown;
    };
    const eventType = parsed.event_type ?? parsed.event_kind;
    if (typeof eventType !== "string" || !parsed.payload) return null;
    return { event_type: eventType, payload: parsed.payload } as UnifiedStreamEvent;
  } catch {
    return null;
  }
}
