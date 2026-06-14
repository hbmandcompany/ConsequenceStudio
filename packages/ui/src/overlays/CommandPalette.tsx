import { useEffect, useMemo, useRef, useState } from "react";
import {
  COMMAND_SECTION_LABELS,
  commandDefinitions,
  formatShortcut,
  type CommandDefinition,
} from "../keymap.js";
import { tokens } from "../design-system/tokens.js";
import { filterCommands, groupFilteredCommands } from "./command-palette-utils.js";

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onExecute: (commandId: string) => void;
  /** Optional override list (defaults to global definitions). */
  commands?: CommandDefinition[];
}

export function CommandPalette({
  open,
  onClose,
  onExecute,
  commands = commandDefinitions,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterCommands(commands, query), [commands, query]);
  const groups = useMemo(() => groupFilteredCommands(filtered), [filtered]);
  const flat = useMemo(() => groups.flatMap((g) => g.commands), [groups]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
        return;
      }
      if (event.key === "Enter" && flat[activeIndex]) {
        event.preventDefault();
        onExecute(flat[activeIndex].id);
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flat, activeIndex, onClose, onExecute]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`[data-command-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  let rowIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{
        paddingTop: "18vh",
        backgroundColor: "rgba(0,0,0,0.55)",
      }}
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: "100%",
          maxWidth: tokens.spacing.commandPaletteMaxWidth,
          maxHeight: tokens.spacing.commandPaletteMaxHeight,
          backgroundColor: tokens.colors.background.elevated,
          border: `1px solid ${tokens.colors.border.active}`,
          borderRadius: tokens.borderRadius.lg,
          boxShadow: tokens.colors.shadow.modal,
          fontFamily: tokens.typography.fontFamily.ui,
        }}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Type a command…"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: tokens.typography.fontSize.body,
            color: tokens.colors.text.primary,
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${tokens.colors.border.hairline}`,
            outline: "none",
          }}
        />

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto" style={{ padding: "6px 0" }}>
          {flat.length === 0 ? (
            <div
              style={{
                padding: "16px 14px",
                fontSize: tokens.typography.fontSize.compact,
                color: tokens.colors.text.muted,
              }}
            >
              No matching commands
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.section}>
                <div
                  style={{
                    padding: "6px 14px 4px",
                    fontSize: tokens.typography.fontSize.xs,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.text.muted,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {COMMAND_SECTION_LABELS[group.section]}
                </div>
                {group.commands.map((command) => {
                  const index = rowIndex++;
                  const active = index === activeIndex;
                  return (
                    <button
                      key={command.id}
                      type="button"
                      data-command-index={index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        onExecute(command.id);
                        onClose();
                      }}
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: tokens.typography.fontSize.body,
                        color: tokens.colors.text.primary,
                        background: active ? tokens.colors.background.modal : "transparent",
                      }}
                    >
                      <span style={{ flex: 1 }}>{command.label}</span>
                      {command.shortcut ? (
                        <span
                          style={{
                            fontFamily: tokens.typography.fontFamily.mono,
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.text.secondary,
                          }}
                        >
                          {formatShortcut(command.shortcut)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
