import { loadStreamConfig } from "./config.js";
import type { DoctorSuggestionPayload } from "./types.js";

export interface ConductorChatRequest {
  message: string;
  session_id?: string;
  contexts?: string[];
  studio_context?: {
    musical_context?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
    diagnostics_count?: number;
    suggestions_count?: number;
    analysis?: {
      key: string;
      mode: string;
      chord: string;
      tension: number;
    };
  };
}

export type ConductorStreamEvent =
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "suggestions"; items: DoctorSuggestionPayload[] };

/** Stream chat from the Consequence Conductor (Qwen orchestrator). */
export async function streamConductorChat(
  request: ConductorChatRequest,
  handlers: {
    onEvent: (event: ConductorStreamEvent) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const config = loadStreamConfig();
  const base = config.conductorHttpUrl.replace(/\/$/, "");
  if (!base) {
    handlers.onEvent({
      type: "error",
      message: "Conductor URL is not configured (set VITE_STUDIO_CONDUCTOR_HTTP_URL)",
    });
    return;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.conductorAuthToken) {
    headers.Authorization = `Bearer ${config.conductorAuthToken}`;
  }

  const res = await fetch(`${base}/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      session_id: "studio-session-1",
      ...request,
    }),
    signal: handlers.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let message = errText || `Conductor error ${res.status}`;
    try {
      const parsed = JSON.parse(errText) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      // keep raw text
    }
    handlers.onEvent({ type: "error", message });
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    handlers.onEvent({ type: "error", message: "Conductor returned empty body" });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as ConductorStreamEvent;
        handlers.onEvent(parsed);
      } catch {
        // skip malformed line
      }
    }
  }

  if (buffer.trim()) {
    try {
      handlers.onEvent(JSON.parse(buffer) as ConductorStreamEvent);
    } catch {
      // ignore trailing garbage
    }
  }
}

/** Probe conductor /health. */
export async function checkConductorHealth(): Promise<boolean> {
  const config = loadStreamConfig();
  const base = config.conductorHttpUrl.replace(/\/$/, "");
  if (!base) return false;
  try {
    const res = await fetch(`${base}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
