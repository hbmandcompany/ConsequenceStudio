import { describe, it, expect } from "vitest";
import { PianoRollModel } from "./piano-roll-model.js";

describe("@consequence/audio", () => {
  it("creates a piano roll model with notes", () => {
    const model = new PianoRollModel([
      { id: "1", pitch: 60, velocity: 100, tick: 0, duration: 480, trackId: "track-1" },
    ]);
    expect(model.count).toBe(1);
  });
});
