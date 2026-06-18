import type { CmteAnalysisPayload, ConnectionStatus } from "./types.js";
import { enrichAnalysisFrame } from "./monte-carlo-projection.js";
import type {
  TheoryAnalysisFrame,
  TheoryCapabilities,
  TheoryMidiInputEvent,
  TheorySessionResponse,
} from "./theory-types.js";

export interface TheoryEngineConfig {
  httpBaseUrl: string;
  authToken: string;
  hubMode?: boolean;
}

type FrameHandler = (frame: TheoryAnalysisFrame) => void;
type StatusHandler = (status: ConnectionStatus) => void;

const WS_OPEN = 1;

function pitchName(root: number): string {
  return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][root % 12] ?? "C";
}

/** HTTP + WebSocket client for Consequence Music Theory Engine at :8741. */
export class TheoryEngineClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private status: ConnectionStatus = "disconnected";
  private frameHandlers = new Set<FrameHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private capabilities: TheoryCapabilities | null = null;
  private intentionalDisconnect = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly config: TheoryEngineConfig) {}

  getSessionId(): string | null {
    return this.sessionId;
  }

  getCapabilities(): TheoryCapabilities | null {
    return this.capabilities;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onFrame(handler: FrameHandler): () => void {
    this.frameHandlers.add(handler);
    return () => this.frameHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private theoryHeaders(): HeadersInit {
    if (!this.config.authToken) return {};
    return { Authorization: `Bearer ${this.config.authToken}` };
  }

  async fetchCapabilities(): Promise<TheoryCapabilities> {
    const base = this.config.httpBaseUrl.replace(/\/$/, "");
    const headers = this.theoryHeaders();
    try {
      const response = await fetch(`${base}/capabilities`, { headers });
      if (response.ok) {
        this.capabilities = (await response.json()) as TheoryCapabilities;
        return this.capabilities;
      }
    } catch {
      // fall through to /health
    }

    const health = await fetch(`${base}/health`, { headers });
    if (!health.ok) {
      throw new Error(`Theory engine unreachable at ${base}`);
    }
    const payload = (await health.json()) as { status: string; version: string };
    this.capabilities = {
      status: payload.status,
      version: payload.version,
      endpoints: {
        createSession: "/sessions",
        ingestEvents: "/sessions/{id}/events",
        stream: "/sessions/{id}/stream",
        analysis: "/sessions/{id}/analysis",
        health: "/health",
      },
      auth: "bearer",
      monte_carlo: { walks: 1000, walk_length: 4, top_candidates: 5 },
    };
    return this.capabilities;
  }

  async createSession(sessionId?: string): Promise<TheorySessionResponse> {
    const id = sessionId ?? crypto.randomUUID();
    const base = this.config.httpBaseUrl.replace(/\/$/, "");

    try {
      const response = await fetch(`${base}/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: id }),
      });
      if (response.ok) {
        const body = (await response.json()) as TheorySessionResponse;
        this.sessionId = body.session_id ?? id;
        return { session_id: this.sessionId, created: true };
      }
    } catch {
      // engine may not expose POST /sessions yet
    }

    this.sessionId = id;
    return { session_id: id, created: true };
  }

  async postEvents(events: TheoryMidiInputEvent[]): Promise<number> {
    if (!this.sessionId) throw new Error("Theory session not created");
    const base = this.config.httpBaseUrl.replace(/\/$/, "");
    const response = await fetch(`${base}/sessions/${this.sessionId}/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(events),
    });
    if (!response.ok) {
      throw new Error(`Theory event ingest failed: ${response.status}`);
    }
    const body = (await response.json()) as { accepted: number };
    return body.accepted;
  }

  connectStream(): void {
    if (!this.sessionId) throw new Error("Theory session not created");
    if (this.ws?.readyState === WS_OPEN) return;

    this.clearReconnect();
    const http = this.config.httpBaseUrl.replace(/\/$/, "");
    const wsBase = http.replace(/^http/, "ws");
    const url = `${wsBase}/sessions/${this.sessionId}/stream?token=${encodeURIComponent(this.config.authToken)}`;
    this.setStatus("connecting");

    const socket = new WebSocket(url);
    this.ws = socket;
    socket.onopen = () => this.setStatus("connected");
    socket.onclose = () => {
      this.ws = null;
      this.setStatus("disconnected");
      if (!this.intentionalDisconnect) this.scheduleReconnect();
    };
    socket.onerror = () => {
      socket.close();
    };
    socket.onmessage = (msg) => this.dispatchFrame(String(msg.data));
  }

  async connect(sessionId?: string): Promise<void> {
    this.intentionalDisconnect = false;
    await this.fetchCapabilities();
    await this.createSession(sessionId);
    if (!this.config.hubMode) {
      this.connectStream();
    } else {
      this.setStatus("connected");
    }
  }

  disconnect(): void {
    this.intentionalDisconnect = true;
    this.clearReconnect();
    this.ws?.close();
    this.ws = null;
    this.setStatus("disconnected");
  }

  /** Map CMTE frame to simplified analysis payload for status bar / transport. */
  static toCmteSummary(frame: TheoryAnalysisFrame) {
    const key = frame.tonality_analysis.estimated_key;
    const chord = frame.harmonic_analysis.detected_chord;
    return {
      key: pitchName(key.root),
      mode: key.mode,
      chord: chord?.spelling && !/^\d/.test(chord.spelling) ? chord.spelling : chord ? pitchName(chord.root) : null,
      roman_numeral: frame.harmonic_analysis.chord_function,
      tension: frame.harmonic_analysis.harmonic_tension,
      confidence: key.confidence,
      tonal_ambiguity: frame.tonality_analysis.tonal_ambiguity,
    };
  }

  /** Same as toCmteSummary but with chord coerced for CmteAnalysisPayload consumers. */
  static toCmtePayload(frame: TheoryAnalysisFrame): CmteAnalysisPayload {
    const summary = TheoryEngineClient.toCmteSummary(frame);
    return {
      ...summary,
      chord: summary.chord ?? "—",
    };
  }

  /** Test helper — inject a frame without a live socket. */
  simulateFrame(raw: TheoryAnalysisFrame): void {
    this.setStatus("connected");
    this.dispatchParsed(raw);
  }

  private dispatchFrame(data: string): void {
    try {
      const parsed = JSON.parse(data) as TheoryAnalysisFrame;
      this.dispatchParsed(parsed);
    } catch {
      // ignore malformed frames
    }
  }

  private dispatchParsed(raw: TheoryAnalysisFrame): void {
    const frame = enrichAnalysisFrame(raw);
    for (const handler of this.frameHandlers) {
      handler(frame);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const handler of this.statusHandlers) {
      handler(status);
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      if (this.sessionId && !this.intentionalDisconnect) {
        this.connectStream();
      }
    }, 2500);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
