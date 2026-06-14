import type { UnifiedStreamEvent } from "@consequence/stream";
import { applyEvent, reconstructFromEvents } from "./event-reconstructor.js";
import { useAnalysisStore } from "./analysis-store.js";
import { useCollaborationStore } from "./collaboration-store.js";
import { useDoctorStore } from "./doctor-store.js";
import { useLedgerStore } from "./ledger-store.js";
import { usePianoRollStore } from "./piano-roll-store.js";
import { useMusicalContextCache } from "./musical-context-cache.js";
import { useSessionStore } from "./session-store.js";
import { useTheoryStore } from "./theory-store.js";

/** Push a reconstructed snapshot into all Zustand stores. */
export function syncStoresFromEvent(event: UnifiedStreamEvent): void {
  const next = applyEvent(
    {
      session: {
        tempo: useSessionStore.getState().tempo,
        timeSignature: useSessionStore.getState().timeSignature,
        isPlaying: useSessionStore.getState().isPlaying,
        positionTicks: useSessionStore.getState().positionTicks,
      },
      notes: usePianoRollStore.getState().notes,
      analysis: {
        key: useAnalysisStore.getState().key,
        mode: useAnalysisStore.getState().mode,
        chord: useAnalysisStore.getState().chord,
        romanNumeral: useAnalysisStore.getState().romanNumeral,
        tension: useAnalysisStore.getState().tension,
        confidence: useAnalysisStore.getState().confidence,
      },
      doctor: {
        diagnostics: useDoctorStore.getState().diagnostics,
        suggestions: useDoctorStore.getState().suggestions,
      },
      ledger: useLedgerStore.getState().ledger,
      collaboration: {
        participants: useCollaborationStore.getState().participants,
        messages: useCollaborationStore.getState().messages,
      },
    },
    event,
  );

  useSessionStore.getState().syncFromReconstruction(next.session);
  usePianoRollStore.getState().syncFromReconstruction(next.notes);
  useAnalysisStore.getState().syncFromReconstruction(next.analysis);
  useDoctorStore.getState().syncFromReconstruction(next.doctor);
  if (next.ledger) useLedgerStore.getState().syncFromReconstruction(next.ledger);
  useCollaborationStore.getState().syncFromReconstruction(next.collaboration);

  if (event.event_type === "theory_monte_carlo_frame") {
    useTheoryStore.getState().setMonteCarloOutput(
      event.payload.monte_carlo_output,
      event.payload.frame_id,
      event.payload.tick,
    );
    useTheoryStore.getState().setAnalysisPanel(
      event.payload.analysis_panel,
      event.payload.frame_id,
      event.payload.tick,
    );
    const session = useSessionStore.getState();
    useMusicalContextCache.getState().updateFromAnalysisPanel(event.payload.analysis_panel, {
      positionTicks: session.positionTicks,
      timeSignature: session.timeSignature,
      tempo: session.tempo,
    });
  }

  if (event.event_type === "transport_state_event") {
    const session = useSessionStore.getState();
    if (!useMusicalContextCache.getState().snapshot) {
      useMusicalContextCache.getState().updateFromTransportFallback({
        positionTicks: session.positionTicks,
        timeSignature: session.timeSignature,
        tempo: session.tempo,
      });
    }
  }
}

/** Subscribe all Zustand stores to a unified event stream. */
export function bindStoresToStream(stream: {
  subscribe: (listener: (event: UnifiedStreamEvent) => void) => () => void;
}): () => void {
  return stream.subscribe(syncStoresFromEvent);
}

/** Reset all stores from a full event log — used for replay and audit. */
export function resetStoresFromEvents(events: UnifiedStreamEvent[]): void {
  const state = reconstructFromEvents(events);
  useSessionStore.getState().syncFromReconstruction(state.session);
  usePianoRollStore.getState().syncFromReconstruction(state.notes);
  useAnalysisStore.getState().syncFromReconstruction(state.analysis);
  useDoctorStore.getState().syncFromReconstruction(state.doctor);
  if (state.ledger) useLedgerStore.getState().syncFromReconstruction(state.ledger);
  useCollaborationStore.getState().syncFromReconstruction(state.collaboration);
}
