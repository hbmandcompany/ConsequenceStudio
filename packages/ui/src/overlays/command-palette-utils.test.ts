import { describe, expect, it } from "vitest";
import { commandDefinitions } from "../keymap.js";
import { filterCommands, groupFilteredCommands } from "./command-palette-utils.js";

describe("command-palette-utils", () => {
  it("returns all commands when query is empty", () => {
    expect(filterCommands(commandDefinitions, "")).toHaveLength(commandDefinitions.length);
  });

  it("filters by label and keywords", () => {
    const results = filterCommands(commandDefinitions, "ledger");
    expect(results.some((c) => c.id === "consequence.ledger")).toBe(true);
    expect(results.every((c) => c.section === "consequence" || c.label.toLowerCase().includes("ledger"))).toBe(
      true,
    );
  });

  it("supports multi-token queries", () => {
    const results = filterCommands(commandDefinitions, "doctor panel");
    expect(results.some((c) => c.id === "view.toggle-doctor")).toBe(true);
  });

  it("groups filtered commands by section order", () => {
    const filtered = filterCommands(commandDefinitions, "transport");
    const groups = groupFilteredCommands(filtered);
    expect(groups[0]?.section).toBe("transport");
    expect(groups[0]?.commands.length).toBeGreaterThan(0);
  });
});
