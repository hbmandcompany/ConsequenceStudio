import {
  getMusicalContextForGeneration,
  useDoctorStore,
  visibleDiagnostics,
  visibleSuggestions,
  type AssistantContext,
} from "@consequence/state";
import { useAnalysisStore } from "@consequence/state";
import { streamConductorChat, type DoctorSuggestionPayload } from "@consequence/stream";

export interface AssistantStreamHandlers {
  onToken: (text: string) => void;
  onDone: (suggestions?: DoctorSuggestionPayload[]) => void;
  onError: (message: string) => void;
}

export function sendAssistantMessage(
  message: string,
  contexts: AssistantContext[],
  handlers: AssistantStreamHandlers,
  signal?: AbortSignal,
): void {
  const diagnostics = visibleDiagnostics(useDoctorStore.getState());
  const suggestions = visibleSuggestions(useDoctorStore.getState());
  const analysis = useAnalysisStore.getState();

  void streamConductorChat(
    {
      message,
      contexts,
      studio_context: {
        musical_context: getMusicalContextForGeneration() as unknown as Record<string, unknown>,
        diagnostics_count: diagnostics.length,
        suggestions_count: suggestions.length,
        analysis: {
          key: analysis.key ?? "",
          mode: analysis.mode ?? "",
          chord: analysis.chord ?? "",
          tension: analysis.tension,
        },
      },
    },
    {
      signal,
      onEvent: (event) => {
        if (event.type === "token") handlers.onToken(event.text);
        else if (event.type === "done") {
          const lower = message.toLowerCase();
          const editSuggestions =
            contexts.includes("doctor") && /fix|correct|resolve|clean|suggest/.test(lower)
              ? suggestions
              : undefined;
          handlers.onDone(editSuggestions);
        } else if (event.type === "error") handlers.onError(event.message);
      },
    },
  );
}
