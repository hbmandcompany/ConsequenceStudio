import { describe, it, expect } from "vitest";
import { validateTokens } from "./token-validator.js";
import { tokens } from "@consequence/ui/design-system";

describe("@consequence/figma-mcp", () => {
  it("validates complete token objects", () => {
    expect(validateTokens(tokens as unknown as Record<string, unknown>)).toBe(true);
  });

  it("rejects incomplete token objects", () => {
    expect(validateTokens({})).toBe(false);
    expect(validateTokens(null as unknown as Record<string, unknown>)).toBe(false);
  });
});
