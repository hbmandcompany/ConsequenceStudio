import { useEffect } from "react";
import { resolveShortcut } from "@consequence/state";
import { commandDefinitions } from "@consequence/ui";
import { executeCommand } from "./command-actions.js";

function isModKey(event: KeyboardEvent): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? navigator.userAgent)
    ? event.metaKey
    : event.ctrlKey;
}

function normalizeKey(key: string): string {
  if (key === " ") return "Space";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function eventMatchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split("+").map((p) => p.trim());
  const needsMod = parts.includes("mod");
  const needsShift = parts.includes("Shift");
  const needsAlt = parts.includes("Alt");
  const keyPart = parts.filter((p) => !["mod", "Shift", "Alt"].includes(p)).at(-1);
  if (!keyPart) return false;
  if (needsMod !== isModKey(event)) return false;
  if (needsShift !== event.shiftKey) return false;
  if (needsAlt !== event.altKey) return false;
  return normalizeKey(event.key) === normalizeKey(keyPart);
}

/** Global keyboard shortcut handler (Phase 19) — respects keymap-store overrides. */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      for (const cmd of commandDefinitions) {
        const shortcut = resolveShortcut(cmd.id, cmd.shortcut);
        if (!shortcut) continue;
        if (eventMatchesShortcut(event, shortcut)) {
          event.preventDefault();
          executeCommand(cmd.id);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
