import type { ConnectionStatus } from "./types.js";
import { parseStreamEvent, type UnifiedStreamEvent } from "./types.js";

export type MessageHandler = (event: UnifiedStreamEvent) => void;
export type StatusHandler = (status: ConnectionStatus) => void;

const WS_OPEN = 1;

interface SocketHandle {
  readyState: number;
  close: () => void;
  send: (data: string) => void;
}

/** Low-level WebSocket wrapper shared by all stream clients. */
export class WebSocketClient {
  private ws: SocketHandle | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private status: ConnectionStatus = "disconnected";
  private url = "";

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  connect(url: string): void {
    if (this.ws?.readyState === WS_OPEN) return;
    this.url = url;
    this.setStatus("connecting");

    const browserWs = new WebSocket(url);
    this.ws = browserWs;
    browserWs.onopen = () => this.setStatus("connected");
    browserWs.onclose = () => {
      this.setStatus("disconnected");
      this.ws = null;
    };
    browserWs.onerror = () => this.setStatus("disconnected");
    browserWs.onmessage = (msg) => this.dispatchMessage(String(msg.data));
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.setStatus("disconnected");
  }

  send(data: unknown): void {
    if (this.ws?.readyState !== WS_OPEN) {
      throw new Error(`WebSocket not connected to ${this.url}`);
    }
    this.ws.send(JSON.stringify(data));
  }

  private dispatchMessage(data: string): void {
    const event = parseStreamEvent(data);
    if (!event) return;
    for (const handler of this.messageHandlers) {
      handler(event);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const handler of this.statusHandlers) {
      handler(status);
    }
  }

  /** Test helper — simulates a successful connection without a live socket. */
  simulateConnect(): void {
    this.setStatus("connected");
  }

  /** Test helper — injects a parsed message as if received from the server. */
  simulateMessage(event: UnifiedStreamEvent): void {
    for (const handler of this.messageHandlers) {
      handler(event);
    }
  }
}
