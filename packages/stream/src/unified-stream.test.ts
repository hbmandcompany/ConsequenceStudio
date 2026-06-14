import { describe, it, expect } from "vitest";
import { UnifiedStream } from "./unified-stream.js";
import { allFixtureEvents, transportEvent, cmteFrame } from "./fixtures/events.js";
import { theoryAnalysisFrame } from "./fixtures/theory-frame.js";

describe("UnifiedStream", () => {
  it("merges simulated events from all services", () => {
    const stream = new UnifiedStream();
    const types: string[] = [];
    stream.subscribe((e) => types.push(e.event_type));
    stream.connectAll();

    for (const client of [
      stream.stream,
      stream.doctor,
      stream.ledger,
      stream.floppydisk,
    ]) {
      client["ws"].simulateConnect();
    }

    for (const event of allFixtureEvents) {
      if (event.event_type === "midi_note_event" || event.event_type === "transport_state_event" ||
          event.event_type === "collaboration_presence_event" || event.event_type === "collaboration_chat_event") {
        stream.stream["ws"].simulateMessage(event);
      } else if (event.event_type === "cmte_analysis_frame") {
        stream.emit(event);
      } else if (event.event_type === "doctor_diagnostic_event" || event.event_type === "doctor_suggestion_event") {
        stream.doctor["ws"].simulateMessage(event);
      } else if (event.event_type === "ledger_update_event") {
        stream.ledger["ws"].simulateMessage(event);
      }
    }

    expect(types.length).toBe(allFixtureEvents.length);
    stream.disconnectAll();
  });

  it("tracks connection status per service", () => {
    const stream = new UnifiedStream();
    stream.connectAll();
    stream.stream["ws"].simulateConnect();
    stream.cmte.simulateFrame(theoryAnalysisFrame);
    stream.doctor["ws"].simulateConnect();
    stream.ledger["ws"].simulateConnect();
    stream.floppydisk["ws"].simulateConnect();
    expect(stream.getConnectionStatus().cmte).toBe("connected");
    expect(stream.getConnectionStatus().poet).toBe("disconnected");
    stream.disconnectAll();
    expect(stream.getConnectionStatus().cmte).toBe("disconnected");
  });

  it("emit forwards to subscribers without a live connection", () => {
    const stream = new UnifiedStream();
    const received: string[] = [];
    stream.subscribe((e) => received.push(e.event_type));
    stream.emit(transportEvent);
    stream.emit(cmteFrame);
    expect(received).toEqual(["transport_state_event", "cmte_analysis_frame"]);
  });
});
