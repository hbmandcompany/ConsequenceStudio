import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export interface BridgeError {
  code: string;
  message: string;
}

export interface SystemInfo {
  cpu_count: number;
  memory_total_mb: number;
  platform: string;
  architecture: string;
}

const BROWSER_SYSTEM_INFO: SystemInfo = {
  cpu_count: typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? 4 : 4,
  memory_total_mb: 8192,
  platform: typeof navigator !== "undefined" ? navigator.platform : "browser",
  architecture: "unknown",
};

export interface MidiDeviceInfo {
  id: string;
  name: string;
  direction: "input" | "output";
}

export interface MidiDeviceList {
  inputs: MidiDeviceInfo[];
  outputs: MidiDeviceInfo[];
}

export interface MidiInputEvent {
  device_id: string;
  message: number[];
  timestamp: number;
}

/** Typed Tauri command invocations matching Rust handlers in commands.rs. */
export async function nativeGetSystemInfo(): Promise<SystemInfo> {
  if (!isTauriRuntime()) return BROWSER_SYSTEM_INFO;
  return invoke<SystemInfo>("native_get_system_info");
}

export async function fileOpenProject(path: string): Promise<unknown> {
  return invoke<unknown>("file_open_project", { path });
}

export async function fileSaveProject(projectData: unknown, path: string): Promise<void> {
  return invoke<void>("file_save_project", { projectData, path });
}

export async function midiEnumerateDevices(): Promise<MidiDeviceList> {
  return invoke<MidiDeviceList>("midi_enumerate_devices");
}

export async function midiOpenInput(deviceId: string): Promise<void> {
  return invoke<void>("midi_open_input", { deviceId });
}

export async function midiCloseInput(deviceId: string): Promise<void> {
  return invoke<void>("midi_close_input", { deviceId });
}

export async function midiSendOutput(deviceId: string, message: number[]): Promise<void> {
  return invoke<void>("midi_send_output", { deviceId, message });
}

export async function streamConnect(
  url: string,
  params: Record<string, unknown> = {},
): Promise<void> {
  return invoke<void>("stream_connect", { url, params });
}

export async function streamDisconnect(connectionId: string): Promise<void> {
  return invoke<void>("stream_disconnect", { connectionId });
}

export function onMidiInput(callback: (event: MidiInputEvent) => void): Promise<UnlistenFn> {
  return listen<MidiInputEvent>("midi_input", (event) => callback(event.payload));
}

export async function poetGetSessionState(sessionId: string): Promise<unknown> {
  return invoke<unknown>("poet_get_session_state", { sessionId });
}
