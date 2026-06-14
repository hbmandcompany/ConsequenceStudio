import { beforeEach, describe, expect, it } from "vitest";
import type { GeneratedLine, PoetToken, PoetryGenerationEvent, SupervisionAction } from "@consequence/stream";
import { usePoetStore } from "./poet-store.js";

const line = (index: number, text: string, state: GeneratedLine["supervision_state"] = "PENDING"): GeneratedLine => ({
  line_index: index,
  text,
  syllable_count: 8,
  beat_placement_suggestions: [],
  emotional_vector: [0.1, 0.2],
  stress_pattern: "iambic",
  constraint_compliance: {
    rhyme_scheme_satisfied: true,
    syllable_count_satisfied: true,
    meter_compliance_score: 1,
    violations: [],
  },
  supervision_state: state,
});

describe("poet-store", () => {
  beforeEach(() => {
    usePoetStore.setState({
      connection_state: "disconnected",
      streaming_lines: {},
      completed_lines: {},
      supervision_pending: false,
      supervision_mode: "SUPERVISED",
      is_streaming: false,
      generation_history: [],
      active_branch_lines: [],
      constraint_set: {},
      constraints_locked: false,
      pending_generation: null,
      generation_error: null,
    });
  });

  it("receiveToken updates streaming_lines until line boundary", () => {
    const token: PoetToken = {
      generation_id: "g1",
      session_id: "s1",
      token_text: "hel",
      token_index: 0,
      is_line_boundary: false,
      is_segment_boundary: false,
      accumulated_line_text: "hel",
      syllable_count_so_far: 1,
      timestamp_ms: 1,
      line_index: 0,
    };
    usePoetStore.getState().receiveToken(token);
    expect(usePoetStore.getState().streaming_lines[0]).toBe("hel");
    expect(usePoetStore.getState().completed_lines[0]).toBeUndefined();

    usePoetStore.getState().receiveToken({
      ...token,
      token_text: "lo",
      accumulated_line_text: "hello",
      is_line_boundary: true,
      syllable_count_so_far: 2,
    });
    expect(usePoetStore.getState().streaming_lines[0]).toBeUndefined();
    expect(usePoetStore.getState().completed_lines[0]?.text).toBe("hello");
  });

  it("receiveGenerationComplete sets supervision_pending for SUPERVISED mode", () => {
    const event: PoetryGenerationEvent = {
      generation_id: "g1",
      intent_id: "i1",
      session_id: "s1",
      user_id: "u1",
      timestamp_ms: 1,
      generation_status: "COMPLETE",
      segment_type: "VERSE",
      lines: [line(0, "First line")],
      structural_metadata: {},
      model_id: "poet-v1",
      latency_ms: 120,
      token_count: 12,
    };
    usePoetStore.getState().receiveGenerationComplete(event);
    const state = usePoetStore.getState();
    expect(state.completed_lines[0]?.text).toBe("First line");
    expect(state.supervision_pending).toBe(true);
    expect(state.is_streaming).toBe(false);
  });

  it("applySupervisionAction ACCEPT_LINE moves line to active_branch_lines", () => {
    usePoetStore.getState().receiveGenerationComplete({
      generation_id: "g1",
      intent_id: "i1",
      session_id: "s1",
      user_id: "u1",
      timestamp_ms: 1,
      generation_status: "COMPLETE",
      segment_type: "VERSE",
      lines: [line(0, "Accepted line")],
      structural_metadata: {},
      model_id: "poet-v1",
      latency_ms: 80,
      token_count: 8,
    });
    const action: SupervisionAction = {
      action_id: "a1",
      generation_id: "g1",
      session_id: "s1",
      user_id: "u1",
      timestamp_ms: 2,
      action_type: "ACCEPT_LINE",
      target_line_index: 0,
    };
    usePoetStore.getState().applySupervisionAction(action);
    expect(usePoetStore.getState().active_branch_lines).toHaveLength(1);
    expect(usePoetStore.getState().completed_lines[0]?.supervision_state).toBe("ACCEPTED");
  });

  it("applySupervisionAction EDIT_LINE stores human source", () => {
    usePoetStore.setState({ completed_lines: { 0: line(0, "draft") } });
    usePoetStore.getState().applySupervisionAction({
      action_id: "a2",
      generation_id: "g1",
      session_id: "s1",
      user_id: "u1",
      timestamp_ms: 2,
      action_type: "EDIT_LINE",
      target_line_index: 0,
      edited_text: "edited",
    });
    expect(usePoetStore.getState().active_branch_lines[0]?.source).toBe("human");
    expect(usePoetStore.getState().active_branch_lines[0]?.text).toBe("edited");
  });

  it("applySupervisionAction LOCK_CONSTRAINT updates constraint_set", () => {
    usePoetStore.getState().applySupervisionAction({
      action_id: "a3",
      generation_id: "g1",
      session_id: "s1",
      user_id: "u1",
      timestamp_ms: 2,
      action_type: "LOCK_CONSTRAINT",
      constraint_lock: { rhyme_scheme: "ABAB", line_count: 4 },
    });
    expect(usePoetStore.getState().constraint_set.rhyme_scheme).toBe("ABAB");
    expect(usePoetStore.getState().constraints_locked).toBe(true);
  });

  it("applySupervisionAction BRANCH_CREATE sets current branch", () => {
    usePoetStore.getState().applySupervisionAction({
      action_id: "a4",
      generation_id: "g1",
      session_id: "s1",
      user_id: "u1",
      timestamp_ms: 2,
      action_type: "BRANCH_CREATE",
      branch_id: "branch-b",
    });
    expect(usePoetStore.getState().current_branch_id).toBe("branch-b");
    expect(usePoetStore.getState().active_branch_lines).toHaveLength(0);
  });

  it("setConnectionState transitions through all values", () => {
    const states = ["disconnected", "connecting", "connected", "reconnecting"] as const;
    for (const state of states) {
      usePoetStore.getState().setConnectionState(state);
      expect(usePoetStore.getState().connection_state).toBe(state);
    }
  });
});
