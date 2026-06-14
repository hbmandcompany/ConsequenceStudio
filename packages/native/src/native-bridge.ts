import { MidiDeviceManager } from "./midi-device-manager.js";
import { FileManager } from "./file-manager.js";
import {
  nativeGetSystemInfo,
  streamConnect,
  streamDisconnect,
  type SystemInfo,
} from "./tauri-commands.js";

/** Unified abstraction over all native Tauri capabilities. */
export class NativeBridge {
  readonly midi = new MidiDeviceManager();
  readonly files = new FileManager();

  getSystemInfo(): Promise<SystemInfo> {
    return nativeGetSystemInfo();
  }

  connectStream(url: string, connectionId = "default"): Promise<void> {
    return streamConnect(url, { connection_id: connectionId });
  }

  disconnectStream(connectionId = "default"): Promise<void> {
    return streamDisconnect(connectionId);
  }
}

export const nativeBridge = new NativeBridge();
