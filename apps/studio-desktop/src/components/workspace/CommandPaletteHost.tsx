import { useEffect } from "react";
import { useKeymapStore, useWorkspaceStore } from "@consequence/state";
import { CommandPalette, KeymapSettingsPanel } from "@consequence/ui";
import { executeCommand } from "./command-actions.js";
import { useGlobalShortcuts } from "./useGlobalShortcuts.js";

function isModKey(event: KeyboardEvent): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? navigator.userAgent)
    ? event.metaKey
    : event.ctrlKey;
}

export function CommandPaletteHost() {
  const open = useWorkspaceStore((s) => s.commandPaletteOpen);
  const closeCommandPalette = useWorkspaceStore((s) => s.closeCommandPalette);
  const toggleCommandPalette = useWorkspaceStore((s) => s.toggleCommandPalette);
  const keymapOpen = useKeymapStore((s) => s.settingsOpen);
  const closeKeymapSettings = useKeymapStore((s) => s.closeSettings);

  useGlobalShortcuts();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isModKey(event) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCommandPalette]);

  return (
    <>
      <CommandPalette
        open={open}
        onClose={closeCommandPalette}
        onExecute={executeCommand}
      />
      <KeymapSettingsPanel open={keymapOpen} onClose={closeKeymapSettings} />
    </>
  );
}

export function useCommandPaletteTrigger() {
  return useWorkspaceStore((s) => s.openCommandPalette);
}
