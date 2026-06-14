import { describe, it, expect, afterEach } from "vitest";
import { VideoSessionManager } from "./video-session-manager.js";

describe("VideoSessionManager", () => {
  const manager = new VideoSessionManager();

  afterEach(() => {
    manager.disconnect();
  });

  it("starts with camera and mic disabled", () => {
    expect(manager.isCameraEnabled).toBe(false);
    expect(manager.isMicEnabled).toBe(false);
    expect(manager.getLocalStream()).toBeNull();
  });

  it("disconnect resets session state", () => {
    manager.disconnect();
    expect(manager.isCameraEnabled).toBe(false);
    expect(manager.isMicEnabled).toBe(false);
  });
});
