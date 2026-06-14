import { useMusicalContextCache } from "./musical-context-cache.js";
import { useSessionStore } from "./session-store.js";
import { useTheoryStore } from "./theory-store.js";
import type { MusicalContextInput } from "@consequence/stream";
import { usePoetStore } from "./poet-store.js";

/** Assemble musical context input from session + theory stores. */
export function selectMusicalContextInput(): MusicalContextInput {
  const session = useSessionStore.getState();
  const analysisPanel = useTheoryStore.getState().analysisPanel;
  return {
    positionTicks: session.positionTicks,
    timeSignature: session.timeSignature,
    tempo: session.tempo,
    analysisPanel,
  };
}

/** Preferred musical context for generation — uses MusicalContextCache when populated. */
export function getMusicalContextForGeneration() {
  return useMusicalContextCache.getState().getSnapshotForGeneration();
}

export function selectPoetStatusLabel(): "idle" | "streaming" | "review" {
  const { is_streaming, supervision_pending, connection_state } = usePoetStore.getState();
  if (is_streaming) return "streaming";
  if (supervision_pending && connection_state === "connected") return "review";
  return "idle";
}
