import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth-store.js";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false, username: "" });
  });

  it("signs in with any non-empty credentials", () => {
    const ok = useAuthStore.getState().signIn("creator", "password");
    expect(ok).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().username).toBe("creator");
  });

  it("rejects empty credentials", () => {
    const ok = useAuthStore.getState().signIn("", "");
    expect(ok).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("signs up with any non-empty credentials", () => {
    const ok = useAuthStore.getState().signUp("newuser", "secret");
    expect(ok).toBe(true);
    expect(useAuthStore.getState().username).toBe("newuser");
  });

  it("signs out", () => {
    useAuthStore.getState().signIn("creator", "password");
    useAuthStore.getState().signOut();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
