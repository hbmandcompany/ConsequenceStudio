import { describe, expect, it, vi } from "vitest";
import { loadStreamConfig } from "./config.js";
import { PoetStreamClient } from "./poet-client.js";
import type { LLMIntentSignal, SupervisionAction } from "./poet-types.js";

describe("PoetStreamClient", () => {
  const config = {
    ...loadStreamConfig(),
    poetPingIntervalMs: 50_000,
    poetPongTimeoutMs: 5_000,
  };

  it("serializes generation requests with injected musical context", () => {
    const getMusicalContext = vi.fn(() => ({
      current_bar: 2,
      current_beat: 1,
      current_key_root: 0,
      current_key_mode: "major",
      harmonic_tension: 0.4,
      rhythmic_density: 0.5,
      melodic_contour: "ascending",
      structural_position: "verse",
      tempo_bpm: 120,
      time_signature_numerator: 4,
      time_signature_denominator: 4,
      bars_in_current_section: 4,
    }));
    const client = new PoetStreamClient(config, getMusicalContext);
    const events: unknown[] = [];
    client.onEvent((event) => events.push(event));

    const signal: LLMIntentSignal = {
      intent_id: "intent-1",
      session_id: "sess-1",
      user_id: "user-1",
      composition_id: "comp-1",
      timestamp_ms: 0,
      session_mode: "LIVE",
      generation_target: "VERSE",
      musical_context: getMusicalContext(),
      creative_freedom: 0.6,
      supervision_mode: "SUPERVISED",
    };

    client.sendGenerationRequest(signal);
    expect(getMusicalContext).toHaveBeenCalled();
  });

  it("routes POET_TOKEN and GENERATION_COMPLETE to unified stream events", () => {
    const client = new PoetStreamClient(config, () => ({
      current_bar: 1,
      current_beat: 1,
      current_key_root: 0,
      current_key_mode: "major",
      harmonic_tension: 0.3,
      rhythmic_density: 0.5,
      melodic_contour: "flat",
      structural_position: "unknown",
      tempo_bpm: 120,
      time_signature_numerator: 4,
      time_signature_denominator: 4,
      bars_in_current_section: 4,
    }));
    const received: string[] = [];
    client.onEvent((event) => received.push(event.event_type));

    client.simulateEnvelope({
      message_type: "POET_TOKEN",
      message_id: "m1",
      session_id: "s1",
      timestamp_ms: 1,
      schema_version: "1.0",
      payload: {
        generation_id: "g1",
        session_id: "s1",
        token_text: "hi",
        token_index: 0,
        is_line_boundary: false,
        is_segment_boundary: false,
        accumulated_line_text: "hi",
        syllable_count_so_far: 1,
        timestamp_ms: 1,
      },
    });

    client.simulateEnvelope({
      message_type: "GENERATION_COMPLETE",
      message_id: "m2",
      session_id: "s1",
      timestamp_ms: 2,
      schema_version: "1.0",
      payload: {
        generation_id: "g1",
        intent_id: "i1",
        session_id: "s1",
        user_id: "u1",
        timestamp_ms: 2,
        generation_status: "COMPLETE",
        segment_type: "VERSE",
        lines: [],
        structural_metadata: {},
        model_id: "poet-v1",
        latency_ms: 10,
        token_count: 1,
      },
    });

    expect(received).toEqual(["poet_token", "poetry_generation_complete"]);
  });

  it("serializes supervision action variants via simulate path", () => {
    const client = new PoetStreamClient(config, () => ({
      current_bar: 1,
      current_beat: 1,
      current_key_root: 0,
      current_key_mode: "major",
      harmonic_tension: 0.3,
      rhythmic_density: 0.5,
      melodic_contour: "flat",
      structural_position: "unknown",
      tempo_bpm: 120,
      time_signature_numerator: 4,
      time_signature_denominator: 4,
      bars_in_current_section: 4,
    }));

    const action: SupervisionAction = {
      action_id: "a1",
      generation_id: "g1",
      session_id: "s1",
      user_id: "u1",
      timestamp_ms: 1,
      action_type: "ACCEPT_LINE",
      target_line_index: 0,
    };
    client.sendSupervisionAction(action);
    expect(action.action_type).toBe("ACCEPT_LINE");
  });

  it("updates connection state callback on connect lifecycle", () => {
    const states: string[] = [];
    const client = new PoetStreamClient(
      config,
      () => ({
        current_bar: 1,
        current_beat: 1,
        current_key_root: 0,
        current_key_mode: "major",
        harmonic_tension: 0.3,
        rhythmic_density: 0.5,
        melodic_contour: "flat",
        structural_position: "unknown",
        tempo_bpm: 120,
        time_signature_numerator: 4,
        time_signature_denominator: 4,
        bars_in_current_section: 4,
      }),
      (state) => states.push(state),
    );
    client.connect("sess-1", "ws://localhost:0");
    expect(states[0]).toBe("connecting");
    client.disconnect();
    expect(states.at(-1)).toBe("disconnected");
  });
});
