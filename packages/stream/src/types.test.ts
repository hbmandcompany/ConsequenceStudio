import { describe, it, expect } from "vitest";
import { parseStreamEvent } from "./types.js";
import { transportEvent } from "./fixtures/events.js";

describe("parseStreamEvent", () => {
  it("parses valid events", () => {
    const parsed = parseStreamEvent(JSON.stringify(transportEvent));
    expect(parsed?.event_type).toBe("transport_state_event");
    if (parsed?.event_type === "transport_state_event") {
      expect(parsed.payload.tempo).toBe(128);
    }
  });

  it("returns null for invalid JSON", () => {
    expect(parseStreamEvent("not json")).toBeNull();
  });

  it("returns null for missing event_type", () => {
    expect(parseStreamEvent('{"payload":{}}')).toBeNull();
  });
});
