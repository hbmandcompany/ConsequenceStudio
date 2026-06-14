import { describe, it, expect } from "vitest";
import { tokens } from "./design-system/tokens.js";

describe("@consequence/ui", () => {
  it("exports design system modules", async () => {
    const ui = await import("./index.js");
    expect(ui).toBeDefined();
    expect(tokens.colors.background.canvas).toBe("#080808");
  });
});
