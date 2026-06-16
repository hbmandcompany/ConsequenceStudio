/** Centralized service URL configuration — no hardcoded endpoints in clients. */
export interface StreamConfig {
  consequenceStreamWsUrl: string;
  cmteWsUrl: string;
  doctorWsUrl: string;
  ledgerWsUrl: string;
  floppydiskHttpUrl: string;
  floppydiskWsUrl: string;
  theoryEngineHttpUrl: string;
  theoryEngineAuthToken: string;
  poetWsUrl: string;
  poetHttpUrl: string;
  poetApiKey: string;
  poetMaxReconnectAttempts: number;
  poetPingIntervalMs: number;
  poetPongTimeoutMs: number;
  studioEnableStream: boolean;
  studioEnableLedger: boolean;
  studioLedgerHttpUrl: string;
  conductorHttpUrl: string;
  conductorAuthToken: string;
}

function envFlag(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

/** Resolve HTTP(S) or relative proxy paths to a WebSocket base URL. */
export function resolveServiceWsUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) return trimmed.replace(/\/$/, "");
  if (trimmed.startsWith("http://")) return trimmed.replace(/^http/, "ws").replace(/\/$/, "");
  if (trimmed.startsWith("https://")) return trimmed.replace(/^https/, "wss").replace(/\/$/, "");
  if (trimmed.startsWith("/")) {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const loc = (globalThis as Window & typeof globalThis).location;
      const proto = loc.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${loc.host}${trimmed}`.replace(/\/$/, "");
    }
    return null;
  }
  return trimmed.replace(/\/$/, "");
}

export function loadStreamConfig(): StreamConfig {
  const conductorHttpUrl = import.meta.env.VITE_STUDIO_CONDUCTOR_HTTP_URL ?? "";
  const explicitPoetWs =
    import.meta.env.VITE_STUDIO_POET_WS_URL ?? import.meta.env.VITE_POET_WS_URL ?? "";
  const poetWsUrl = explicitPoetWs || conductorHttpUrl;
  const poetHttpUrl =
    import.meta.env.VITE_STUDIO_POET_HTTP_URL ??
    import.meta.env.VITE_POET_HTTP_URL ??
    conductorHttpUrl;
  const streamUrl =
    import.meta.env.VITE_STUDIO_STREAM_URL ??
    import.meta.env.VITE_CONSEQUENCE_STREAM_WS_URL ??
    "ws://localhost:8001/stream";
  const ledgerHttpUrl =
    import.meta.env.VITE_STUDIO_LEDGER_URL ??
    import.meta.env.VITE_LEDGER_HTTP_URL ??
    "http://localhost:8002";

  return {
    consequenceStreamWsUrl: streamUrl,
    cmteWsUrl: import.meta.env.VITE_CMTE_WS_URL ?? "ws://localhost:8081/cmte",
    doctorWsUrl: import.meta.env.VITE_DOCTOR_WS_URL ?? "ws://localhost:8082/doctor",
    ledgerWsUrl: import.meta.env.VITE_LEDGER_WS_URL ?? "ws://localhost:8083/ledger",
    floppydiskHttpUrl:
      import.meta.env.VITE_FLOPPYDISK_HTTP_URL ?? "http://localhost:8084",
    floppydiskWsUrl: import.meta.env.VITE_FLOPPYDISK_WS_URL ?? "ws://localhost:8084/ws",
    theoryEngineHttpUrl: import.meta.env.VITE_THEORY_ENGINE_HTTP_URL ?? "",
    theoryEngineAuthToken: import.meta.env.VITE_THEORY_ENGINE_AUTH_TOKEN ?? "",
    poetWsUrl,
    poetHttpUrl,
    poetApiKey:
      import.meta.env.VITE_STUDIO_POET_API_KEY ?? import.meta.env.VITE_POET_API_KEY ?? "",
    poetMaxReconnectAttempts: Number(import.meta.env.VITE_POET_MAX_RECONNECT_ATTEMPTS ?? 10),
    poetPingIntervalMs: Number(import.meta.env.VITE_POET_PING_INTERVAL_MS ?? 30_000),
    poetPongTimeoutMs: Number(import.meta.env.VITE_POET_PONG_TIMEOUT_MS ?? 5_000),
    studioEnableStream: envFlag(import.meta.env.VITE_STUDIO_ENABLE_STREAM),
    studioEnableLedger: envFlag(import.meta.env.VITE_STUDIO_ENABLE_LEDGER),
    studioLedgerHttpUrl: ledgerHttpUrl,
    conductorHttpUrl,
    conductorAuthToken:
      import.meta.env.VITE_STUDIO_CONDUCTOR_AUTH_TOKEN ??
      import.meta.env.VITE_CONDUCTOR_AUTH_TOKEN ??
      "",
  };
}
