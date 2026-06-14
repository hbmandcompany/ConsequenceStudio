import { describe, it, expect } from "vitest";
import { allFixtureEvents } from "@consequence/stream";
import { ReplayEngine } from "./replay-engine.js";
import { useSessionStore } from "./session-store.js";
import { useAnalysisStore } from "./analysis-store.js";

describe("ReplayEngine", () => {
  it("replays events into stores", () => {
    const engine = new ReplayEngine(allFixtureEvents);
    const seen: string[] = [];

    engine.start({
      onEvent: (e) => seen.push(e.event_type),
    });

    expect(seen.length).toBe(allFixtureEvents.length);
    expect(useSessionStore.getState().tempo).toBe(128);
    expect(useAnalysisStore.getState().key).toBe("C");
    expect(engine.isPlaying()).toBe(false);
  });

  it("steps through events one at a time", () => {
    const engine = new ReplayEngine(allFixtureEvents.slice(0, 2));
    const first = engine.stepForward();
    expect(first?.event_type).toBe("transport_state_event");
    expect(useSessionStore.getState().isPlaying).toBe(true);
    const second = engine.stepForward();
    expect(second?.event_type).toBe("midi_note_event");
  });
});
