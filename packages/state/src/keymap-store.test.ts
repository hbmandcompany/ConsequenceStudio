import { beforeEach, describe, expect, it } from "vitest";
import { resolveShortcut, useKeymapStore } from "./keymap-store.js";

describe("keymap-store", () => {
  beforeEach(() => {
    useKeymapStore.setState({ overrides: {}, settingsOpen: false });
  });

  it("resolves override over default shortcut", () => {
    useKeymapStore.getState().setShortcutOverride("transport.play", "P");
    expect(resolveShortcut("transport.play", "Space")).toBe("P");
  });

  it("falls back to default when no override", () => {
    expect(resolveShortcut("transport.stop", "Shift+Space")).toBe("Shift+Space");
  });

  it("clears individual overrides", () => {
    useKeymapStore.getState().setShortcutOverride("transport.play", "P");
    useKeymapStore.getState().clearShortcutOverride("transport.play");
    expect(resolveShortcut("transport.play", "Space")).toBe("Space");
  });
});
