import { describe, it, expect } from "vitest";
import { tokens } from "./tokens.js";
import { colors } from "./colors.js";
import { typography } from "./typography.js";

describe("design system", () => {
  it("exports complete token set", () => {
    expect(tokens.colors.background.canvas).toBe("#080808");
    expect(tokens.typography.fontFamily.ui).toContain("Inter");
    expect(tokens.spacing.transportBarHeight).toBe(52);
    expect(tokens.borderRadius.md).toBe("8px");
  });

  it("colors match specification palette", () => {
    expect(colors.text.primary).toBe("#F2F2F2");
    expect(colors.accent.cmte).toBe("#3A4A7A");
    expect(colors.accent.doctor).toBe("#5A3A7A");
  });

  it("typography scale is defined", () => {
    expect(typography.fontSize.display).toBe("32px");
    expect(typography.fontSize.body).toBe("13px");
  });
});
