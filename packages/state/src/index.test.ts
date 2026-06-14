import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "./session-store.js";

describe("useSessionStore", () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessionName: "Untitled Session",
      tempo: 120,
      timeSignature: [4, 4],
      isPlaying: false,
      positionTicks: 0,
    });
  });

  it("updates session name", () => {
    useSessionStore.getState().setSessionName("Test Session");
    expect(useSessionStore.getState().sessionName).toBe("Test Session");
  });
});
