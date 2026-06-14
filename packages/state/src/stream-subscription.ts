import type { UnifiedStreamEvent } from "@consequence/stream";
import { usePoetStore } from "./poet-store.js";

/** Subscribe a handler to unified stream poet events. */
export function subscribeToStream(
  stream: { subscribe: (listener: (event: UnifiedStreamEvent) => void) => () => void },
  handler: (event: UnifiedStreamEvent) => void,
): () => void {
  return stream.subscribe(handler);
}

/** Wire poet-store to unified stream poet events. */
export function bindPoetStoreToStream(stream: {
  subscribe: (listener: (event: UnifiedStreamEvent) => void) => () => void;
}): () => void {
  return subscribeToStream(stream, (event) => {
    switch (event.event_type) {
      case "poet_token":
        usePoetStore.getState().receiveToken(event.payload);
        break;
      case "poetry_generation_complete":
        usePoetStore.getState().receiveGenerationComplete(event.payload);
        break;
      case "poet_error":
        usePoetStore.getState().receiveGenerationError(event.payload);
        break;
      case "poet_backend_status":
        usePoetStore.getState().updateBackendStatus(event.payload);
        break;
      default:
        break;
    }
  });
}
