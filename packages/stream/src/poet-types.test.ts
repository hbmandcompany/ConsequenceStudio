import { describe, expect, it } from "vitest";
import type { LLMIntentSignal, PoetToken, SupervisionAction } from "./poet-types.js";

describe("poet-types", () => {
  it("accepts valid LLMIntentSignal objects", () => {
    const signal: LLMIntentSignal = {
      intent_id: "intent-1",
      session_id: "sess-1",
      user_id: "user-1",
      composition_id: "comp-1",
      timestamp_ms: Date.now(),
      session_mode: "LIVE",
      generation_target: "VERSE",
      musical_context: {
        current_bar: 1,
        current_beat: 1,
        current_key_root: 0,
        current_key_mode: "major",
        harmonic_tension: 0.3,
        rhythmic_density: 0.5,
        melodic_contour: "ascending",
        structural_position: "verse",
        tempo_bpm: 120,
        time_signature_numerator: 4,
        time_signature_denominator: 4,
        bars_in_current_section: 4,
      },
      creative_freedom: 0.6,
      supervision_mode: "SUPERVISED",
    };
    expect(signal.generation_target).toBe("VERSE");
  });

  it("accepts valid PoetToken and SupervisionAction objects", () => {
    const token: PoetToken = {
      generation_id: "gen-1",
      session_id: "sess-1",
      token_text: "hello",
      token_index: 0,
      is_line_boundary: false,
      is_segment_boundary: false,
      accumulated_line_text: "hello",
      syllable_count_so_far: 2,
      timestamp_ms: 1,
      line_index: 0,
    };
    const action: SupervisionAction = {
      action_id: "act-1",
      generation_id: "gen-1",
      session_id: "sess-1",
      user_id: "user-1",
      timestamp_ms: 1,
      action_type: "ACCEPT_LINE",
      target_line_index: 0,
    };
    expect(token.token_text).toBe("hello");
    expect(action.action_type).toBe("ACCEPT_LINE");
  });
});
