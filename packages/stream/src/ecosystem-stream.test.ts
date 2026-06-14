import { describe, expect, it } from "vitest";
import {
  buildIntentEnvelope,
  buildSupervisionEnvelope,
  nextLamportTimestamp,
  publishEcosystemEvent,
} from "./ecosystem-stream.js";
import type { LLMIntentSignal, SupervisionAction } from "./poet-types.js";

describe("ecosystem-stream", () => {
  it("builds monotonic lamport timestamps", () => {
    const a = nextLamportTimestamp();
    const b = nextLamportTimestamp();
    expect(b).toBeGreaterThan(a);
  });

  it("wraps LLMIntentSignal in schema_version 1 envelope", () => {
    const signal: LLMIntentSignal = {
      intent_id: "intent-1",
      session_id: "sess-1",
      user_id: "user-1",
      composition_id: "comp-1",
      timestamp_ms: Date.now(),
      session_mode: "LIVE",
      generation_target: "VERSE",
      musical_context: {
        current_bar: 4,
        current_beat: 2,
        current_key_root: 0,
        current_key_mode: "major",
        harmonic_tension: 0.4,
        rhythmic_density: 0.5,
        melodic_contour: "ascending",
        structural_position: "verse",
        tempo_bpm: 120,
        time_signature_numerator: 4,
        time_signature_denominator: 4,
        bars_in_current_section: 2,
        is_stale: false,
      },
      constraint_set: { rhyme_scheme: "ABAB", target_syllable_counts: [10, 10, 10, 10], line_count: 4 },
      creative_freedom: 0.5,
      max_cost_usdc: 0.5,
      supervision_mode: "INTERACTIVE",
      lora_adapter_id: null,
      branch_id: null,
      context_window: [],
    };
    const envelope = buildIntentEnvelope(signal);
    expect(envelope.event_type).toBe("LLMIntentSignal");
    expect(envelope.schema_version).toBe(1);
    expect(envelope.session_id).toBe("sess-1");
    expect(envelope.payload.intent_id).toBe("intent-1");
  });

  it("publishes only when stream client exposes publishAudit", () => {
    const calls: unknown[] = [];
    const stream = { publishAudit: (e: unknown) => calls.push(e) };
    const action: SupervisionAction = {
      action_id: "a1",
      generation_id: "g1",
      session_id: "sess-1",
      user_id: "user-1",
      timestamp_ms: Date.now(),
      action_type: "ACCEPT_LINE",
      target_line_index: 0,
    };
    publishEcosystemEvent(stream, buildSupervisionEnvelope(action));
    expect(calls).toHaveLength(1);
    publishEcosystemEvent(null, buildSupervisionEnvelope(action));
    expect(calls).toHaveLength(1);
  });
});
