import { create } from "zustand";
import type { ConnectionMap } from "@consequence/stream";

export interface SystemInfoState {
  cpuCount: number;
  memoryTotalMb: number;
  platform: string;
  connectionStatus: ConnectionMap;
}

export interface SystemInfoActions {
  setSystemInfo: (info: {
    cpu_count: number;
    memory_total_mb: number;
    platform: string;
  }) => void;
  setConnectionStatus: (status: ConnectionMap) => void;
}

export const useSystemStore = create<SystemInfoState & SystemInfoActions>((set) => ({
  cpuCount: 0,
  memoryTotalMb: 0,
  platform: "",
  connectionStatus: {
    consequenceStream: "disconnected",
    cmte: "disconnected",
    doctor: "disconnected",
    ledger: "disconnected",
    floppydisk: "disconnected",
    poet: "disconnected",
  },
  setSystemInfo: (info) =>
    set({
      cpuCount: info.cpu_count,
      memoryTotalMb: info.memory_total_mb,
      platform: info.platform,
    }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
