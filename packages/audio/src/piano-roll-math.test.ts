import { describe, it, expect } from "vitest";
import {
  pitchToY,
  snapTick,
  tickToX,
  ticksPerBar,
  xToTick,
  yToPitch,
} from "./piano-roll-math.js";
import { PianoRollModel } from "./piano-roll-model.js";

describe("piano-roll-math", () => {
  it("maps ticks and pitches to canvas coordinates", () => {
    const ts: [number, number] = [4, 4];
    expect(ticksPerBar(ts)).toBe(1920);
    expect(tickToX(480, 120, ts, 0)).toBeCloseTo(30, 0);
    expect(pitchToY(60, 12, 0)).toBe(67 * 12);
    expect(yToPitch(pitchToY(72, 12, 100), 12, 100)).toBe(72);
    expect(xToTick(30, 120, ts, 0)).toBeGreaterThan(0);
  });

  it("snaps ticks to quantization grid", () => {
    expect(snapTick(100, "1/16")).toBe(120);
  });
});

describe("PianoRollModel", () => {
  it("sorts and queries notes", () => {
    const model = new PianoRollModel([
      { id: "b", pitch: 60, velocity: 100, tick: 480, duration: 240, trackId: "t1" },
      { id: "a", pitch: 62, velocity: 90, tick: 0, duration: 240, trackId: "t1" },
    ]);
    expect(model.all()[0].id).toBe("a");
    expect(model.inRange(0, 500)).toHaveLength(2);
    expect(model.upsert({ id: "c", pitch: 64, velocity: 80, tick: 960, duration: 120, trackId: "t1" }).remove("a").count).toBe(2);
  });
});
