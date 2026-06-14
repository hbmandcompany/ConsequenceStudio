import { create } from "zustand";

export interface KeymapStoreState {
  overrides: Record<string, string>;
  settingsOpen: boolean;
}

export interface KeymapStoreActions {
  setShortcutOverride: (commandId: string, shortcut: string) => void;
  clearShortcutOverride: (commandId: string) => void;
  resetAllOverrides: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useKeymapStore = create<KeymapStoreState & KeymapStoreActions>((set) => ({
  overrides: {},
  settingsOpen: false,
  setShortcutOverride: (commandId, shortcut) =>
    set((state) => ({
      overrides: { ...state.overrides, [commandId]: shortcut },
    })),
  clearShortcutOverride: (commandId) =>
    set((state) => {
      const next = { ...state.overrides };
      delete next[commandId];
      return { overrides: next };
    }),
  resetAllOverrides: () => set({ overrides: {} }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));

export function resolveShortcut(commandId: string, defaultShortcut?: string): string | undefined {
  const override = useKeymapStore.getState().overrides[commandId];
  return override ?? defaultShortcut;
}
