/** ConsequencePoet protocol types — mirrors poet/protocols/events.py schemas. */

export type SessionMode = "LIVE" | "EDIT" | "BATCH" | "EXPERIMENTAL";
export type GenerationTarget = "VERSE" | "HOOK" | "BRIDGE" | "ADLIB" | "LINE" | "FREE";
export type SupervisionMode = "AUTOMATIC" | "SUPERVISED" | "INTERACTIVE";
export type GenerationStatus = "STREAMING" | "COMPLETE" | "REJECTED" | "BRANCHED" | "ERROR";
export type SupervisionState = "PENDING" | "ACCEPTED" | "REJECTED" | "EDITED";
export type SupervisionActionType =
  | "ACCEPT_LINE"
  | "REJECT_LINE"
  | "ACCEPT_SEGMENT"
  | "REJECT_SEGMENT"
  | "EDIT_LINE"
  | "LOCK_CONSTRAINT"
  | "BRANCH_CREATE"
  | "BRANCH_SELECT"
  | "REGENERATE_SEGMENT";

export interface PriorLine {
  text: string;
  line_index: number;
  segment_type: string;
  source: "generated" | "human";
  syllable_count: number;
  rhyme_class?: string;
  accepted_at: number;
}

export interface ConstraintSet {
  rhyme_scheme?: string;
  target_syllable_counts?: number[];
  meter_pattern?: string;
  line_count?: number;
  locked_line_endings?: Record<string, string>;
}

export interface MusicalContextSnapshot {
  current_bar: number;
  current_beat: number;
  current_key_root: number;
  current_key_mode: string;
  harmonic_tension: number;
  rhythmic_density: number;
  melodic_contour: string;
  structural_position: string;
  tempo_bpm: number;
  time_signature_numerator: number;
  time_signature_denominator: number;
  bars_in_current_section: number;
  is_stale?: boolean;
}

export interface LLMIntentSignal {
  intent_id: string;
  session_id: string;
  user_id: string;
  composition_id: string;
  timestamp_ms: number;
  session_mode: SessionMode;
  generation_target: GenerationTarget;
  musical_context: MusicalContextSnapshot;
  constraint_set?: ConstraintSet;
  creative_freedom: number;
  max_cost_usdc?: number;
  supervision_mode: SupervisionMode;
  lora_adapter_id?: string;
  branch_id?: string;
  context_window?: PriorLine[];
}

export interface PoetToken {
  generation_id: string;
  session_id: string;
  token_text: string;
  token_index: number;
  is_line_boundary: boolean;
  is_segment_boundary: boolean;
  accumulated_line_text: string;
  syllable_count_so_far: number;
  timestamp_ms: number;
  line_index?: number;
}

export interface ConstraintCompliance {
  rhyme_scheme_satisfied: boolean;
  syllable_count_satisfied: boolean;
  meter_compliance_score: number;
  violations: string[];
}

export interface GeneratedLine {
  line_index: number;
  text: string;
  syllable_count: number;
  beat_placement_suggestions: number[];
  rhyme_class?: string;
  emotional_vector: number[];
  stress_pattern: string;
  constraint_compliance: ConstraintCompliance;
  supervision_state: SupervisionState;
}

export interface PoetryGenerationEvent {
  generation_id: string;
  intent_id: string;
  session_id: string;
  user_id: string;
  timestamp_ms: number;
  generation_status: GenerationStatus;
  segment_type: string;
  lines: GeneratedLine[];
  structural_metadata: Record<string, unknown>;
  model_id: string;
  latency_ms: number;
  token_count: number;
}

export interface SupervisionAction {
  action_id: string;
  generation_id: string;
  session_id: string;
  user_id: string;
  timestamp_ms: number;
  action_type: SupervisionActionType;
  target_line_index?: number;
  edited_text?: string;
  constraint_lock?: ConstraintSet;
  branch_id?: string;
}

export interface PoetBackendStatus {
  backend_id: string;
  model_id: string;
  session_mode: SessionMode;
  estimated_cost_usdc: number;
  accumulated_cost_usdc: number;
  budget_remaining_fraction: number;
  routing_reason: string;
}

export interface BranchState {
  branch_id: string;
  parent_branch_id?: string;
  created_at: number;
  accepted_lines: PriorLine[];
  generation_cursor: number;
}

export interface PoetSession {
  session_id: string;
  user_id: string;
  composition_id: string;
  created_at: number;
  last_active_at: number;
  current_branch_id: string;
  branches: Record<string, BranchState>;
  session_mode: SessionMode;
}

export interface PoetErrorPayload {
  error_type: string;
  message: string;
}

export type PoetMessageType =
  | "GENERATION_REQUEST"
  | "SUPERVISION_ACTION"
  | "SESSION_STATE_REQUEST"
  | "SESSION_STATE_SNAPSHOT"
  | "POET_TOKEN"
  | "GENERATION_COMPLETE"
  | "GENERATION_ERROR"
  | "BACKEND_STATUS"
  | "PING"
  | "PONG";

export interface PoetWsEnvelope<T = unknown> {
  message_type: PoetMessageType;
  message_id: string;
  session_id: string;
  timestamp_ms: number;
  schema_version: string;
  payload: T;
}
