import { create } from "zustand";
import type {
  ConstraintSet,
  GeneratedLine,
  LLMIntentSignal,
  PoetBackendStatus,
  PoetSession,
  PoetToken,
  PoetryGenerationEvent,
  PriorLine,
  SessionMode,
  SupervisionAction,
  SupervisionMode,
} from "@consequence/stream";

export type PoetConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

const MAX_HISTORY = 50;

export interface PoetStoreState {
  connection_state: PoetConnectionState;
  current_session: PoetSession | null;
  current_branch_id: string | null;
  pending_generation: { generation_id: string; segment_type: string; intent_id: string; started_at: number } | null;
  streaming_lines: Record<number, string>;
  completed_lines: Record<number, GeneratedLine>;
  current_generation_event: PoetryGenerationEvent | null;
  generation_history: PoetryGenerationEvent[];
  supervision_pending: boolean;
  backend_status: PoetBackendStatus | null;
  active_branch_lines: PriorLine[];
  constraint_set: ConstraintSet;
  creative_freedom: number;
  supervision_mode: SupervisionMode;
  session_mode: SessionMode;
  generation_error: { error_type: string; message: string } | null;
  lora_adapter_id: string | null;
  is_streaming: boolean;
  last_token_timestamp_ms: number | null;
  constraints_locked: boolean;
  constraints_section_open: boolean;
}

export interface PoetStoreActions {
  setConnectionState: (state: PoetConnectionState) => void;
  setCurrentSession: (session: PoetSession) => void;
  beginGeneration: (intentId: string, segmentType: string, generationId?: string) => void;
  receiveToken: (token: PoetToken) => void;
  receiveGenerationComplete: (event: PoetryGenerationEvent) => void;
  receiveGenerationError: (error: { error_type: string; message: string }) => void;
  updateBackendStatus: (status: PoetBackendStatus) => void;
  applySupervisionAction: (action: SupervisionAction) => void;
  setConstraintSet: (constraints: ConstraintSet) => void;
  setCreativeFreedom: (value: number) => void;
  setSupervisionMode: (mode: SupervisionMode) => void;
  setSessionMode: (mode: SessionMode) => void;
  setLoraAdapterId: (adapterId: string | null) => void;
  setConstraintsLocked: (locked: boolean) => void;
  setConstraintsSectionOpen: (open: boolean) => void;
  clearGeneration: () => void;
}

function rebuildBranchLines(session: PoetSession | null, branchId: string | null): PriorLine[] {
  if (!session || !branchId) return [];
  return session.branches[branchId]?.accepted_lines ?? [];
}

function lineIndexFromToken(token: PoetToken): number {
  return token.line_index ?? Math.max(0, token.token_index);
}

export const usePoetStore = create<PoetStoreState & PoetStoreActions>((set, get) => ({
  connection_state: "disconnected",
  current_session: null,
  current_branch_id: null,
  pending_generation: null,
  streaming_lines: {},
  completed_lines: {},
  current_generation_event: null,
  generation_history: [],
  supervision_pending: false,
  backend_status: null,
  active_branch_lines: [],
  constraint_set: {},
  creative_freedom: 0.6,
  supervision_mode: "SUPERVISED",
  session_mode: "LIVE",
  generation_error: null,
  lora_adapter_id: null,
  is_streaming: false,
  last_token_timestamp_ms: null,
  constraints_locked: false,
  constraints_section_open: false,

  setConnectionState: (connection_state) => set({ connection_state }),

  setCurrentSession: (session) =>
    set({
      current_session: session,
      current_branch_id: session.current_branch_id,
      active_branch_lines: rebuildBranchLines(session, session.current_branch_id),
      session_mode: session.session_mode,
    }),

  beginGeneration: (intentId, segmentType, generationId) =>
    set({
      pending_generation: {
        generation_id: generationId ?? `gen-${Date.now()}`,
        segment_type: segmentType,
        intent_id: intentId,
        started_at: Date.now(),
      },
      streaming_lines: {},
      completed_lines: {},
      is_streaming: true,
      generation_error: null,
      supervision_pending: false,
    }),

  receiveToken: (token) => {
    const lineIndex = lineIndexFromToken(token);
    set((state) => {
      const streaming_lines = { ...state.streaming_lines, [lineIndex]: token.accumulated_line_text };
      const completed_lines = { ...state.completed_lines };
      if (token.is_line_boundary) {
        completed_lines[lineIndex] = {
          line_index: lineIndex,
          text: token.accumulated_line_text,
          syllable_count: token.syllable_count_so_far,
          beat_placement_suggestions: [],
          emotional_vector: [],
          stress_pattern: "",
          constraint_compliance: {
            rhyme_scheme_satisfied: true,
            syllable_count_satisfied: true,
            meter_compliance_score: 1,
            violations: [],
          },
          supervision_state: "PENDING",
        };
        delete streaming_lines[lineIndex];
      }
      return {
        streaming_lines,
        completed_lines,
        last_token_timestamp_ms: token.timestamp_ms,
        is_streaming: true,
      };
    });
  },

  receiveGenerationComplete: (event) =>
    set((state) => {
      const completed_lines: Record<number, GeneratedLine> = {};
      for (const line of event.lines) completed_lines[line.line_index] = line;
      const supervision_pending =
        state.supervision_mode !== "AUTOMATIC" &&
        event.lines.some((line) => line.supervision_state === "PENDING");
      return {
        completed_lines,
        current_generation_event: event,
        generation_history: [event, ...state.generation_history].slice(0, MAX_HISTORY),
        pending_generation: null,
        is_streaming: false,
        streaming_lines: {},
        supervision_pending,
      };
    }),

  receiveGenerationError: (error) =>
    set({
      generation_error: error,
      pending_generation: null,
      is_streaming: false,
    }),

  updateBackendStatus: (backend_status) => set({ backend_status }),

  applySupervisionAction: (action) => {
    const state = get();
    const completed_lines = { ...state.completed_lines };
    let active_branch_lines = [...state.active_branch_lines];
    let constraint_set = state.constraint_set;
    let current_branch_id = state.current_branch_id;
    let current_session = state.current_session;
    let constraints_locked = state.constraints_locked;
    let supervision_pending = state.supervision_pending;

    const upsertAccepted = (line: GeneratedLine, source: "generated" | "human", text?: string) => {
      active_branch_lines = [
        ...active_branch_lines,
        {
          text: text ?? line.text,
          line_index: line.line_index,
          segment_type: state.pending_generation?.segment_type ?? "VERSE",
          source,
          syllable_count: line.syllable_count,
          rhyme_class: line.rhyme_class,
          accepted_at: Date.now(),
        },
      ];
    };

    switch (action.action_type) {
      case "ACCEPT_LINE": {
        const idx = action.target_line_index;
        if (idx === undefined) break;
        const line = completed_lines[idx];
        if (!line) break;
        completed_lines[idx] = { ...line, supervision_state: "ACCEPTED" };
        upsertAccepted(line, "generated");
        break;
      }
      case "REJECT_LINE": {
        const idx = action.target_line_index;
        if (idx === undefined) break;
        const line = completed_lines[idx];
        if (!line) break;
        completed_lines[idx] = { ...line, supervision_state: "REJECTED" };
        break;
      }
      case "ACCEPT_SEGMENT":
        for (const [idx, line] of Object.entries(completed_lines)) {
          if (line.supervision_state === "PENDING") {
            completed_lines[Number(idx)] = { ...line, supervision_state: "ACCEPTED" };
            upsertAccepted(line, "generated");
          }
        }
        break;
      case "REJECT_SEGMENT":
        for (const [idx, line] of Object.entries(completed_lines)) {
          if (line.supervision_state === "PENDING") {
            completed_lines[Number(idx)] = { ...line, supervision_state: "REJECTED" };
          }
        }
        break;
      case "EDIT_LINE": {
        const idx = action.target_line_index;
        if (idx === undefined || !action.edited_text) break;
        const line = completed_lines[idx];
        if (!line) break;
        const edited = { ...line, text: action.edited_text, supervision_state: "EDITED" as const };
        completed_lines[idx] = edited;
        upsertAccepted(edited, "human", action.edited_text);
        break;
      }
      case "LOCK_CONSTRAINT":
        if (action.constraint_lock) {
          constraint_set = action.constraint_lock;
          constraints_locked = true;
        }
        break;
      case "BRANCH_CREATE": {
        const branchId = action.branch_id ?? `branch-${Date.now()}`;
        current_branch_id = branchId;
        active_branch_lines = [];
        if (current_session) {
          current_session = {
            ...current_session,
            current_branch_id: branchId,
            branches: {
              ...current_session.branches,
              [branchId]: {
                branch_id: branchId,
                parent_branch_id: state.current_branch_id ?? undefined,
                created_at: Date.now(),
                accepted_lines: [],
                generation_cursor: active_branch_lines.length,
              },
            },
          };
        }
        break;
      }
      case "BRANCH_SELECT": {
        if (!action.branch_id) break;
        current_branch_id = action.branch_id;
        active_branch_lines = rebuildBranchLines(current_session, action.branch_id);
        break;
      }
      default:
        break;
    }

    supervision_pending = Object.values(completed_lines).some(
      (line) => line.supervision_state === "PENDING",
    );

    set({
      completed_lines,
      active_branch_lines,
      constraint_set,
      current_branch_id,
      current_session,
      constraints_locked,
      supervision_pending,
    });
  },

  setConstraintSet: (constraint_set) => set({ constraint_set }),
  setCreativeFreedom: (creative_freedom) => set({ creative_freedom: Math.max(0, Math.min(1, creative_freedom)) }),
  setSupervisionMode: (supervision_mode) => set({ supervision_mode }),
  setSessionMode: (session_mode) => set({ session_mode }),
  setLoraAdapterId: (lora_adapter_id) => set({ lora_adapter_id }),
  setConstraintsLocked: (constraints_locked) => set({ constraints_locked }),
  setConstraintsSectionOpen: (constraints_section_open) => set({ constraints_section_open }),
  clearGeneration: () =>
    set({
      pending_generation: null,
      streaming_lines: {},
      completed_lines: {},
      current_generation_event: null,
      is_streaming: false,
      supervision_pending: false,
      generation_error: null,
    }),
}));

export function buildIntentSignalFromStore(
  target: LLMIntentSignal["generation_target"],
  overrides?: Partial<LLMIntentSignal>,
): Omit<LLMIntentSignal, "musical_context"> {
  const state = usePoetStore.getState();
  return {
    intent_id: `intent-${Date.now()}`,
    session_id: state.current_session?.session_id ?? "studio-session-1",
    user_id: state.current_session?.user_id ?? "local-user",
    composition_id: state.current_session?.composition_id ?? "composition-1",
    timestamp_ms: Date.now(),
    session_mode: state.session_mode,
    generation_target: target,
    constraint_set: state.constraint_set,
    creative_freedom: state.creative_freedom,
    supervision_mode: state.supervision_mode,
    lora_adapter_id: state.lora_adapter_id ?? undefined,
    branch_id: state.current_branch_id ?? undefined,
    context_window: state.active_branch_lines,
    ...overrides,
  };
}
