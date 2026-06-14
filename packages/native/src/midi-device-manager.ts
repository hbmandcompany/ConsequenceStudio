import {
  midiCloseInput,
  midiEnumerateDevices,
  midiOpenInput,
  midiSendOutput,
  onMidiInput,
  type MidiDeviceList,
  type MidiInputEvent,
} from "./tauri-commands.js";

/** Frontend MIDI device management communicating with the Tauri Rust backend. */
export class MidiDeviceManager {
  private activeInputs = new Set<string>();

  async enumerate(): Promise<MidiDeviceList> {
    return midiEnumerateDevices();
  }

  async openInput(deviceId: string): Promise<void> {
    await midiOpenInput(deviceId);
    this.activeInputs.add(deviceId);
  }

  async closeInput(deviceId: string): Promise<void> {
    await midiCloseInput(deviceId);
    this.activeInputs.delete(deviceId);
  }

  async sendOutput(deviceId: string, message: number[]): Promise<void> {
    return midiSendOutput(deviceId, message);
  }

  onInput(callback: (event: MidiInputEvent) => void): Promise<() => void> {
    return onMidiInput(callback);
  }

  getActiveInputs(): string[] {
    return [...this.activeInputs];
  }
}
