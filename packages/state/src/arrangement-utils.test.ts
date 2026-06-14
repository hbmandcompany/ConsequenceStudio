import { describe, it, expect } from "vitest";
import {
  barBeatTick,
  tickToBar,
  ticksPerBar,
  xToTick,
  tickToX,
} from "./arrangement-utils.js";

describe("arrangement-utils", () => {
  it("computes ticks per bar for 4/4", () => {
    expect(ticksPerBar([4, 4])).toBe(1920);
  });

  it("converts ticks to bar position", () => {
    expect(tickToBar(1920, [4, 4])).toBe(1);
    expect(tickToBar(3840, [4, 4])).toBe(2);
  });

  it("formats bar beat tick", () => {
    expect(barBeatTick(0, [4, 4])).toEqual({ bar: 1, beat: 1, subTick: 0 });
    expect(barBeatTick(480, [4, 4])).toEqual({ bar: 1, beat: 2, subTick: 0 });
  });

  it("maps x and tick consistently", () => {
    const ts: [number, number] = [4, 4];
    const tick = xToTick(240, 120, ts, 0);
    const x = tickToX(tick, 120, ts, 0);
    expect(Math.abs(x - 240)).toBeLessThan(2);
  });
});
