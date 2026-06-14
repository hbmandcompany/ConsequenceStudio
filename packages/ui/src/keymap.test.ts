import { describe, expect, it } from "vitest";
import { formatShortcut } from "./keymap.js";

describe("keymap", () => {
  it("formats mod token for shortcuts", () => {
    expect(formatShortcut("mod+K")).toMatch(/\+K$/);
  });
});
