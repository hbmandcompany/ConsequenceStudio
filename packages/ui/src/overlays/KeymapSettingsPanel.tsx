import { useMemo } from "react";
import { useKeymapStore } from "@consequence/state";
import {
  COMMAND_SECTION_LABELS,
  COMMAND_SECTION_ORDER,
  commandDefinitions,
  formatShortcut,
  type CommandDefinition,
} from "../keymap.js";
import { tokens } from "../design-system/tokens.js";

export interface KeymapSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function KeymapSettingsPanel({ open, onClose }: KeymapSettingsPanelProps) {
  const overrides = useKeymapStore((s) => s.overrides);
  const setShortcutOverride = useKeymapStore((s) => s.setShortcutOverride);
  const clearShortcutOverride = useKeymapStore((s) => s.clearShortcutOverride);
  const resetAllOverrides = useKeymapStore((s) => s.resetAllOverrides);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandDefinition[]>();
    for (const section of COMMAND_SECTION_ORDER) map.set(section, []);
    for (const cmd of commandDefinitions) {
      const list = map.get(cmd.section) ?? [];
      list.push(cmd);
      map.set(cmd.section, list);
    }
    return map;
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-[min(640px,92vw)] flex-col overflow-hidden rounded-lg"
        style={{
          backgroundColor: tokens.colors.background.surface,
          border: `1px solid ${tokens.colors.border.standard}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${tokens.colors.border.hairline}` }}
        >
          <h2 style={{ color: tokens.colors.text.primary, fontSize: 14, fontWeight: 600 }}>
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={resetAllOverrides}
            style={{ color: tokens.colors.text.muted, fontSize: 11, background: "none", border: "none", cursor: "pointer" }}
          >
            Reset all
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          {COMMAND_SECTION_ORDER.map((section) => {
            const commands = grouped.get(section) ?? [];
            if (commands.length === 0) return null;
            return (
              <section key={section} className="mb-4">
                <div
                  className="mb-2"
                  style={{
                    color: tokens.colors.text.muted,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {COMMAND_SECTION_LABELS[section]}
                </div>
                {commands.map((cmd) => {
                  const effective = overrides[cmd.id] ?? cmd.shortcut ?? "";
                  return (
                    <div
                      key={cmd.id}
                      className="mb-1 flex items-center gap-2 rounded px-2 py-1"
                      style={{ backgroundColor: tokens.colors.background.elevated }}
                    >
                      <span className="min-w-0 flex-1 truncate" style={{ color: tokens.colors.text.primary, fontSize: 12 }}>
                        {cmd.label}
                      </span>
                      <input
                        value={effective}
                        placeholder="—"
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          if (!value) clearShortcutOverride(cmd.id);
                          else setShortcutOverride(cmd.id, value);
                        }}
                        className="w-28 rounded px-2 py-1 text-right"
                        style={{
                          fontSize: 11,
                          color: tokens.colors.text.secondary,
                          backgroundColor: tokens.colors.background.canvas,
                          border: `1px solid ${tokens.colors.border.standard}`,
                        }}
                      />
                      <span style={{ color: tokens.colors.text.muted, fontSize: 10, width: 72, textAlign: "right" }}>
                        {formatShortcut(cmd.shortcut)}
                      </span>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
        <footer
          className="flex justify-end px-4 py-3"
          style={{ borderTop: `1px solid ${tokens.colors.border.hairline}` }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: 12,
              color: tokens.colors.text.accent,
              backgroundColor: tokens.colors.accent.cmte,
              border: "none",
              borderRadius: 4,
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
