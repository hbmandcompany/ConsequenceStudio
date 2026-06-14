export interface PianoRollNoteData {
  id: string;
  pitch: number;
  velocity: number;
  tick: number;
  duration: number;
  trackId: string;
}

/** Immutable sorted MIDI note collection optimized for range queries. */
export class PianoRollModel {
  private notes: PianoRollNoteData[] = [];

  constructor(initial: PianoRollNoteData[] = []) {
    this.notes = [...initial].sort((a, b) => a.tick - b.tick || a.pitch - b.pitch);
  }

  get count(): number {
    return this.notes.length;
  }

  all(): readonly PianoRollNoteData[] {
    return this.notes;
  }

  inRange(startTick: number, endTick: number): PianoRollNoteData[] {
    return this.notes.filter((n) => n.tick < endTick && n.tick + n.duration > startTick);
  }

  getById(id: string): PianoRollNoteData | undefined {
    return this.notes.find((n) => n.id === id);
  }

  setNotes(notes: PianoRollNoteData[]): PianoRollModel {
    return new PianoRollModel(notes);
  }

  upsert(note: PianoRollNoteData): PianoRollModel {
    const next = this.notes.filter((n) => n.id !== note.id);
    next.push(note);
    return new PianoRollModel(next);
  }

  remove(id: string): PianoRollModel {
    return new PianoRollModel(this.notes.filter((n) => n.id !== id));
  }
}
