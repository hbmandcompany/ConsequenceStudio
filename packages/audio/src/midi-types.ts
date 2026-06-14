/** MIDI event schemas — implemented in Phase 5+. */
export type MidiNoteEvent = {
  note: number;
  velocity: number;
  channel: number;
  tick: number;
  duration: number;
};
