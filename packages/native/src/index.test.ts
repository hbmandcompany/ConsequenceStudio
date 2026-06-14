import { describe, it, expect } from "vitest";
import { NativeBridge } from "./native-bridge.js";

describe("@consequence/native", () => {
  it("exposes native bridge", () => {
    const bridge = new NativeBridge();
    expect(bridge.midi).toBeDefined();
    expect(bridge.files).toBeDefined();
  });
});
