import type { StreamConfig } from "./config.js";
import { resolveServiceWsUrl } from "./config.js";
import type { ConnectionStatus } from "./types.js";
import type { UnifiedStreamEvent } from "./types.js";
import type {
  LLMIntentSignal,
  MusicalContextSnapshot,
  PoetSession,
  PoetWsEnvelope,
  SupervisionAction,
} from "./poet-types.js";

export type PoetConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

export type GetMusicalContext = () => MusicalContextSnapshot;
export type OnPoetConnectionState = (state: PoetConnectionState) => void;
export type OnPoetNotification = (message: string) => void;

let messageCounter = 0;
function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}-${Date.now()}`;
}

/** ConsequencePoet WebSocket streaming client. */
export class PoetStreamClient {
  private ws: WebSocket | null = null;
  private sessionId = "";
  private status: ConnectionStatus = "disconnected";
  private poetConnectionState: PoetConnectionState = "disconnected";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSessionRequests = new Map<
    string,
    { resolve: (session: PoetSession) => void; reject: (err: Error) => void }
  >();
  private eventHandlers = new Set<(event: UnifiedStreamEvent) => void>();
  private statusHandlers = new Set<(status: ConnectionStatus) => void>();

  constructor(
    private readonly config: StreamConfig,
    private readonly getMusicalContext: GetMusicalContext,
    private readonly onConnectionState?: OnPoetConnectionState,
    private readonly onNotification?: OnPoetNotification,
  ) {}

  connect(sessionId: string, poetWsUrl?: string): void {
    this.sessionId = sessionId;
    this.clearTimers();

    const rawBase = poetWsUrl ?? this.config.poetWsUrl;
    const base = resolveServiceWsUrl(rawBase);
    if (!base) {
      this.setPoetConnectionState("disconnected");
      this.setStatus("disconnected");
      return;
    }

    this.setPoetConnectionState("connecting");
    this.setStatus("connecting");

    const url = `${base}/ws/${sessionId}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.setPoetConnectionState("connected");
      this.setStatus("connected");
      this.startPingLoop();
    };

    this.ws.onmessage = (event) => this.handleMessage(String(event.data));

    this.ws.onclose = () => {
      this.clearTimers();
      this.setStatus("disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      const socket = this.ws;
      this.ws = null;
      socket?.close();
    };
  }

  disconnect(): void {
    this.clearTimers();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.reconnectAttempt = this.config.poetMaxReconnectAttempts;
    this.ws?.close();
    this.ws = null;
    this.setPoetConnectionState("disconnected");
    this.setStatus("disconnected");
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getConnectionState(): PoetConnectionState {
    return this.poetConnectionState;
  }

  onEvent(handler: (event: UnifiedStreamEvent) => void): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onStatus(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  sendGenerationRequest(signal: LLMIntentSignal): void {
    const stamped: LLMIntentSignal = {
      ...signal,
      musical_context: this.getMusicalContext(),
      timestamp_ms: Date.now(),
    };
    this.send("GENERATION_REQUEST", stamped);
  }

  sendSupervisionAction(action: SupervisionAction): void {
    this.send("SUPERVISION_ACTION", { ...action, timestamp_ms: Date.now() });
  }

  requestSessionState(sessionId: string): Promise<PoetSession> {
    const messageId = nextMessageId();
    return new Promise((resolve, reject) => {
      this.pendingSessionRequests.set(messageId, { resolve, reject });
      this.send("SESSION_STATE_REQUEST", { session_id: sessionId }, messageId);
      setTimeout(() => {
        if (this.pendingSessionRequests.has(messageId)) {
          this.pendingSessionRequests.delete(messageId);
          reject(new Error("SESSION_STATE_REQUEST timeout"));
        }
      }, 10_000);
    });
  }

  /** Test helper — inject a raw envelope without a live socket. */
  simulateEnvelope(envelope: PoetWsEnvelope): void {
    this.handleEnvelope(envelope);
  }

  private send(messageType: PoetWsEnvelope["message_type"], payload: unknown, messageId?: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const envelope: PoetWsEnvelope = {
      message_type: messageType,
      message_id: messageId ?? nextMessageId(),
      session_id: this.sessionId,
      timestamp_ms: Date.now(),
      schema_version: "1.0",
      payload,
    };
    this.ws.send(JSON.stringify(envelope));
  }

  private handleMessage(raw: string): void {
    try {
      const envelope = JSON.parse(raw) as PoetWsEnvelope;
      this.handleEnvelope(envelope);
    } catch {
      // ignore malformed frames
    }
  }

  private handleEnvelope(envelope: PoetWsEnvelope): void {
    switch (envelope.message_type) {
      case "POET_TOKEN":
        this.publish({ event_type: "poet_token", payload: envelope.payload as never });
        break;
      case "GENERATION_COMPLETE":
        this.publish({
          event_type: "poetry_generation_complete",
          payload: envelope.payload as never,
        });
        break;
      case "GENERATION_ERROR":
        this.publish({ event_type: "poet_error", payload: envelope.payload as never });
        break;
      case "BACKEND_STATUS":
        this.publish({ event_type: "poet_backend_status", payload: envelope.payload as never });
        break;
      case "PONG":
        if (this.pongTimer) clearTimeout(this.pongTimer);
        this.pongTimer = null;
        break;
      case "SESSION_STATE_SNAPSHOT": {
        const pending = this.pendingSessionRequests.get(envelope.message_id);
        if (pending) {
          this.pendingSessionRequests.delete(envelope.message_id);
          pending.resolve(envelope.payload as PoetSession);
        }
        break;
      }
      default:
        break;
    }
  }

  private publish(event: UnifiedStreamEvent): void {
    for (const handler of this.eventHandlers) handler(event);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const handler of this.statusHandlers) handler(status);
  }

  private setPoetConnectionState(state: PoetConnectionState): void {
    this.poetConnectionState = state;
    this.onConnectionState?.(state);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.config.poetMaxReconnectAttempts) {
      this.setPoetConnectionState("disconnected");
      this.onNotification?.("ConsequencePoet connection lost. All reconnect attempts exhausted.");
      return;
    }
    this.setPoetConnectionState("reconnecting");
    const delay = Math.min(30_000, 1000 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      if (this.sessionId) this.connect(this.sessionId);
    }, delay);
  }

  private startPingLoop(): void {
    this.clearTimers();
    this.pingTimer = setInterval(() => {
      this.send("PING", {});
      if (this.pongTimer) clearTimeout(this.pongTimer);
      this.pongTimer = setTimeout(() => {
        this.ws?.close();
      }, this.config.poetPongTimeoutMs);
    }, this.config.poetPingIntervalMs);
  }

  private clearTimers(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.pingTimer = null;
    this.pongTimer = null;
  }
}
