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
}

function envFlag(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export function loadStreamConfig(): StreamConfig {
  const poetWsUrl =
    import.meta.env.VITE_STUDIO_POET_WS_URL ??
    import.meta.env.VITE_POET_WS_URL ??
    "ws://localhost:8000";
  const poetHttpUrl =
    import.meta.env.VITE_STUDIO_POET_HTTP_URL ??
    import.meta.env.VITE_POET_HTTP_URL ??
    "http://localhost:8000";
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
    theoryEngineHttpUrl:
      import.meta.env.VITE_THEORY_ENGINE_HTTP_URL ?? "http://127.0.0.1:8741",
    theoryEngineAuthToken:
      import.meta.env.VITE_THEORY_ENGINE_AUTH_TOKEN ?? "dev-secret-change-in-production",
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
  };
}
