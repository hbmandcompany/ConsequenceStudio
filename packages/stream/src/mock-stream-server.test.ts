import { describe, it, expect, afterEach } from "vitest";
import WS from "ws";
import { createMockStreamServer } from "./__mocks__/mock-stream-server.js";
import { transportEvent, midiNoteEvent } from "./fixtures/events.js";
import type { MockStreamServer } from "./__mocks__/mock-stream-server.js";
import { parseStreamEvent } from "./types.js";

describe("mock-stream-server", () => {
  let server: MockStreamServer | null = null;

  afterEach(async () => {
    if (server) await server.close();
    server = null;
  });

  it("broadcasts typed events to connected clients", async () => {
    server = await createMockStreamServer();
    const received = await new Promise<string>((resolve) => {
      const ws = new WS(server!.url);
      ws.on("message", (data) => {
        resolve(String(data));
        ws.close();
      });
      ws.on("open", () => server!.broadcast(transportEvent));
    });
    const parsed = parseStreamEvent(received);
    expect(parsed?.event_type).toBe("transport_state_event");
  });

  it("delivers multiple events in order", async () => {
    server = await createMockStreamServer();
    const types: string[] = [];
    await new Promise<void>((resolve) => {
      const ws = new WS(server!.url);
      ws.on("message", (data) => {
        const parsed = parseStreamEvent(String(data));
        if (parsed) types.push(parsed.event_type);
        if (types.length === 2) {
          ws.close();
          resolve();
        }
      });
      ws.on("open", () => {
        server!.broadcast(transportEvent);
        server!.broadcast(midiNoteEvent);
      });
    });
    expect(types).toEqual(["transport_state_event", "midi_note_event"]);
  });
});
