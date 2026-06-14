/** Global keyboard shortcut definitions for the command palette and Phase 19 keymap. */

export type CommandSection = "transport" | "edit" | "view" | "session" | "consequence" | "poet";

export const COMMAND_SECTION_LABELS: Record<CommandSection, string> = {
  transport: "Transport",
  edit: "Edit",
  view: "View",
  session: "Session",
  consequence: "Consequence",
  poet: "Poet",
};

export const COMMAND_SECTION_ORDER: CommandSection[] = [
  "transport",
  "edit",
  "view",
  "session",
  "consequence",
  "poet",
];

export interface CommandDefinition {
  id: string;
  label: string;
  section: CommandSection;
  /** Display shortcut (mod = ⌘ on macOS, Ctrl elsewhere). */
  shortcut?: string;
  keywords?: string[];
}

const mod = "mod";

export const commandDefinitions: CommandDefinition[] = [
  { id: "transport.play", label: "Play / Pause", section: "transport", shortcut: "Space", keywords: ["play", "pause", "start"] },
  { id: "transport.stop", label: "Stop", section: "transport", shortcut: "Shift+Space", keywords: ["stop", "halt"] },
  { id: "transport.record", label: "Record", section: "transport", shortcut: "R", keywords: ["record", "arm"] },
  { id: "transport.go-to-bar", label: "Go to Bar 1", section: "transport", shortcut: `${mod}+G`, keywords: ["seek", "bar", "goto"] },
  { id: "edit.select-all", label: "Select All", section: "edit", shortcut: `${mod}+A`, keywords: ["select"] },
  { id: "edit.deselect", label: "Deselect", section: "edit", shortcut: "Escape", keywords: ["clear", "deselect"] },
  { id: "edit.quantize", label: "Quantize Selection", section: "edit", shortcut: "Q", keywords: ["quantize", "grid", "snap"] },
  { id: "edit.duplicate", label: "Duplicate Selection", section: "edit", shortcut: `${mod}+D`, keywords: ["duplicate", "copy"] },
  { id: "view.zoom-in", label: "Zoom In", section: "view", shortcut: `${mod}+=`, keywords: ["zoom", "in", "closer"] },
  { id: "view.zoom-out", label: "Zoom Out", section: "view", shortcut: `${mod}+-`, keywords: ["zoom", "out", "wider"] },
  {
    id: "view.toggle-piano-roll",
    label: "Toggle Piano Roll",
    section: "view",
    shortcut: `${mod}+Shift+U`,
    keywords: ["piano", "roll", "midi"],
  },
  {
    id: "view.toggle-analysis",
    label: "Toggle Analysis Panel",
    section: "view",
    shortcut: `${mod}+Shift+Y`,
    keywords: ["analysis", "cmte", "harmony"],
  },
  {
    id: "view.toggle-doctor",
    label: "Toggle Doctor Panel",
    section: "view",
    shortcut: `${mod}+Shift+D`,
    keywords: ["doctor", "diagnose"],
  },
  { id: "session.save", label: "Save", section: "session", shortcut: `${mod}+S`, keywords: ["save", "write"] },
  { id: "session.save-as", label: "Save As…", section: "session", shortcut: `${mod}+Shift+S`, keywords: ["save", "export"] },
  { id: "session.open", label: "Open…", section: "session", shortcut: `${mod}+O`, keywords: ["open", "load"] },
  { id: "session.new", label: "New Session", section: "session", shortcut: `${mod}+N`, keywords: ["new", "create"] },
  {
    id: "consequence.floppydisk",
    label: "Open Floppydisk Browser",
    section: "consequence",
    shortcut: `${mod}+Shift+F`,
    keywords: ["floppydisk", "assets", "samples"],
  },
  {
    id: "consequence.doctor-analyze",
    label: "Trigger Doctor Analysis",
    section: "consequence",
    shortcut: `${mod}+Shift+J`,
    keywords: ["doctor", "analyze", "diagnose"],
  },
  {
    id: "consequence.ledger",
    label: "Open Ledger Panel",
    section: "consequence",
    shortcut: `${mod}+Shift+E`,
    keywords: ["ledger", "earnings", "staking"],
  },
  {
    id: "consequence.marketplace",
    label: "Search Marketplace",
    section: "consequence",
    shortcut: `${mod}+Shift+M`,
    keywords: ["marketplace", "search", "market"],
  },
  { id: "palette.open", label: "Command Palette", section: "view", shortcut: `${mod}+K`, keywords: ["command", "palette"] },
  {
    id: "view.keymap-settings",
    label: "Keyboard Shortcuts…",
    section: "view",
    shortcut: `${mod}+Shift+K`,
    keywords: ["keymap", "shortcuts", "keyboard"],
  },
  {
    id: "view.doctor-compose",
    label: "Doctor Compose Mode",
    section: "view",
    shortcut: `${mod}+Shift+C`,
    keywords: ["doctor", "compose", "poet", "lyrics"],
  },
  { id: "poet.generate-verse", label: "Generate Verse", section: "poet", shortcut: `${mod}+Shift+V`, keywords: ["poet", "verse", "lyrics"] },
  { id: "poet.generate-hook", label: "Generate Hook", section: "poet", shortcut: `${mod}+Shift+H`, keywords: ["poet", "hook"] },
  { id: "poet.generate-bridge", label: "Generate Bridge", section: "poet", shortcut: `${mod}+Shift+B`, keywords: ["poet", "bridge"] },
  { id: "poet.generate-line", label: "Generate Line", section: "poet", shortcut: `${mod}+Shift+L`, keywords: ["poet", "line"] },
  { id: "poet.accept-all", label: "Accept All Lines", section: "poet", shortcut: `${mod}+Shift+A`, keywords: ["poet", "accept"] },
  { id: "poet.reject-all", label: "Reject All Lines", section: "poet", shortcut: `${mod}+Shift+R`, keywords: ["poet", "reject"] },
  { id: "poet.new-branch", label: "New Branch", section: "poet", shortcut: `${mod}+Shift+N`, keywords: ["poet", "branch"] },
  { id: "poet.toggle-panel", label: "Toggle Poet Panel", section: "poet", shortcut: `${mod}+Shift+P`, keywords: ["poet", "panel"] },
  { id: "poet.open-settings", label: "Open Poet Settings", section: "poet", keywords: ["poet", "constraints", "rhyme"] },
];

/** Resolve `mod` tokens for display in the palette. */
export function formatShortcut(shortcut: string | undefined): string | undefined {
  if (!shortcut) return undefined;
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? navigator.userAgent);
  const modLabel = isMac ? "⌘" : "Ctrl";
  return shortcut.replaceAll("mod", modLabel);
}

export const keymap = {
  definitions: commandDefinitions,
  formatShortcut,
} as const;
