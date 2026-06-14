import { describe, it, expect } from "vitest";
import { StreamClient } from "./stream-client.js";
import { CmteClient } from "./cmte-client.js";
import { DoctorClient } from "./doctor-client.js";
import { LedgerClient } from "./ledger-client.js";
import {
  transportEvent,
  midiNoteEvent,
  cmteFrame,
  doctorDiagnostic,
  doctorSuggestion,
  ledgerUpdate,
} from "./fixtures/events.js";
import { theoryAnalysisFrame } from "./fixtures/theory-frame.js";

const baseConfig = {
  consequenceStreamWsUrl: "ws://localhost:0",
  cmteWsUrl: "ws://localhost:0",
  doctorWsUrl: "ws://localhost:0",
  ledgerWsUrl: "ws://localhost:0",
  floppydiskHttpUrl: "http://localhost:8084",
  floppydiskWsUrl: "ws://localhost:0",
  theoryEngineHttpUrl: "http://127.0.0.1:8741",
  theoryEngineAuthToken: "dev-secret-change-in-production",
};

describe("StreamClient", () => {
  it("receives transport events via simulated connection", () => {
    const client = new StreamClient(baseConfig);
    const types: string[] = [];
    client.onEvent((e) => types.push(e.event_type));
    client["ws"].simulateConnect();
    client["ws"].simulateMessage(transportEvent);
    expect(types).toEqual(["transport_state_event"]);
    expect(client.getStatus()).toBe("connected");
  });

  it("receives midi note events", () => {
    const client = new StreamClient(baseConfig);
    const pitches: number[] = [];
    client.onEvent((e) => {
      if (e.event_type === "midi_note_event") pitches.push(e.payload.pitch);
    });
    client["ws"].simulateConnect();
    client["ws"].simulateMessage(midiNoteEvent);
    expect(pitches[0]).toBe(60);
  });

  it("disconnects cleanly", () => {
    const client = new StreamClient(baseConfig);
    client["ws"].simulateConnect();
    client.disconnect();
    expect(client.getStatus()).toBe("disconnected");
  });
});

describe("service clients", () => {
  it("CmteClient receives analysis frames via simulation", () => {
    const client = new CmteClient(baseConfig);
    const keys: string[] = [];
    client.onAnalysisFrame((f) => keys.push(f.key));
    client.simulateFrame(theoryAnalysisFrame);
    expect(keys[0]).toBe("C");
  });

  it("DoctorClient receives diagnostics and suggestions", () => {
    const client = new DoctorClient(baseConfig);
    const headlines: string[] = [];
    client.onDiagnostic((d) => headlines.push(d.headline));
    client.onSuggestion((s) => headlines.push(s.headline));
    client["ws"].simulateConnect();
    client["ws"].simulateMessage(doctorDiagnostic);
    client["ws"].simulateMessage(doctorSuggestion);
    expect(headlines).toHaveLength(2);
  });

  it("LedgerClient receives economic updates", () => {
    const client = new LedgerClient(baseConfig);
    let earnings = 0;
    client.onUpdate((u) => { earnings = u.projected_earnings_usdc; });
    client["ws"].simulateConnect();
    client["ws"].simulateMessage(ledgerUpdate);
    expect(earnings).toBe(12.45);
  });
});
