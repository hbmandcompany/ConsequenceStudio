import type { StreamConfig } from "./config.js";
import type { EcosystemStreamEnvelope } from "./ecosystem-stream.js";
import type { ConnectionStatus } from "./types.js";
import type { UnifiedStreamEvent } from "./types.js";
import { WebSocketClient } from "./ws-client.js";

/** ConsequenceStream WebSocket client for MIDI and transport events. */
export class StreamClient {
  private readonly ws = new WebSocketClient();

  constructor(private readonly config: StreamConfig) {}

  connect(): void {
    this.ws.connect(this.config.consequenceStreamWsUrl);
  }

  disconnect(): void {
    this.ws.disconnect();
  }

  getStatus(): ConnectionStatus {
    return this.ws.getStatus();
  }

  onEvent(handler: (event: UnifiedStreamEvent) => void): () => void {
    return this.ws.onMessage(handler);
  }

  onStatus(handler: (status: ConnectionStatus) => void): () => void {
    return this.ws.onStatus(handler);
  }

  sendCommand(command: string, payload: Record<string, unknown> = {}): void {
    this.ws.send({ command, ...payload });
  }

  sendChatMessage(message: {
    message_id: string;
    user_id: string;
    author: string;
    text: string;
    timestamp: number;
  }): void {
    this.ws.send({ command: "chat_message", ...message });
  }

  /** Publish ecosystem audit events (LLMIntentSignal, SupervisionAction, …). */
  publishAudit(envelope: EcosystemStreamEnvelope): void {
    this.ws.send({ command: "ecosystem_event", ...envelope });
  }
}
