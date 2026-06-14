import { describe, it, expect } from "vitest";
import {
  allFixtureEvents,
  transportEvent,
  midiNoteEvent,
  cmteFrame,
  ledgerUpdate,
} from "@consequence/stream";
import {
  applyEvent,
  reconstructFromEvents,
  eventsCommute,
} from "./event-reconstructor.js";
import { initialReconstructedState } from "./reconstructed-state.js";

describe("event-reconstructor", () => {
  it("reconstructs session state from transport events", () => {
    const state = reconstructFromEvents([transportEvent]);
    expect(state.session.tempo).toBe(128);
    expect(state.session.isPlaying).toBe(true);
    expect(state.session.positionTicks).toBe(1920);
  });

  it("reconstructs notes from midi events", () => {
    const state = reconstructFromEvents([midiNoteEvent]);
    expect(state.notes).toHaveLength(1);
    expect(state.notes[0].pitch).toBe(60);
  });

  it("reconstructs analysis from CMTE frames", () => {
    const state = reconstructFromEvents([cmteFrame]);
    expect(state.analysis.key).toBe("C");
    expect(state.analysis.chord).toBe("Cmaj7");
  });

  it("reconstructs ledger from update events", () => {
    const state = reconstructFromEvents([ledgerUpdate]);
    expect(state.ledger?.projected_earnings_usdc).toBe(12.45);
  });

  it("reconstructs full state from ordered event log", () => {
    const state = reconstructFromEvents(allFixtureEvents);
    expect(state.session.tempo).toBe(128);
    expect(state.notes.length).toBeGreaterThan(0);
    expect(state.analysis.key).toBe("C");
    expect(state.doctor.diagnostics.length).toBeGreaterThan(0);
    expect(state.ledger).not.toBeNull();
    expect(state.collaboration.participants.length).toBeGreaterThan(0);
  });

  it("removes notes on note-off events", () => {
    if (midiNoteEvent.event_type !== "midi_note_event") throw new Error("fixture type");
    const on = midiNoteEvent;
    const off: typeof on = {
      event_type: "midi_note_event",
      payload: { ...midiNoteEvent.payload, action: "off" },
    };
    const state = reconstructFromEvents([on, off]);
    expect(state.notes).toHaveLength(0);
  });

  it("non-conflicting events commute", () => {
    expect(eventsCommute(transportEvent, cmteFrame)).toBe(true);
    expect(eventsCommute(cmteFrame, ledgerUpdate)).toBe(true);
  });

  it("associativity holds for sequential application", () => {
    const events = [transportEvent, midiNoteEvent, cmteFrame];
    const left = events.reduce(applyEvent, initialReconstructedState());
    const right = reconstructFromEvents(events);
    expect(JSON.stringify(left)).toBe(JSON.stringify(right));
  });
});
