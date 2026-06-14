import { describe, it, expect } from "vitest";
import { formatPlayheadPosition } from "./transport-utils.js";

describe("formatPlayheadPosition", () => {
  it("formats bars:beats:ticks", () => {
    expect(formatPlayheadPosition(0, [4, 4])).toBe("1:1:0");
    expect(formatPlayheadPosition(480, [4, 4])).toBe("1:2:0");
  });
});
