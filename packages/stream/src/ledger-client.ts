import type { StreamConfig } from "./config.js";
import type { ConnectionStatus, LedgerUpdatePayload } from "./types.js";
import { WebSocketClient } from "./ws-client.js";

/** ConsequenceLedger economic events client. */
export class LedgerClient {
  private readonly ws = new WebSocketClient();

  constructor(private readonly config: StreamConfig) {}

  connect(): void {
    this.ws.connect(this.config.ledgerWsUrl);
  }

  disconnect(): void {
    this.ws.disconnect();
  }

  getStatus(): ConnectionStatus {
    return this.ws.getStatus();
  }

  onUpdate(handler: (update: LedgerUpdatePayload) => void): () => void {
    return this.ws.onMessage((event) => {
      if (event.event_type === "ledger_update_event") {
        handler(event.payload);
      }
    });
  }

  onStatus(handler: (status: ConnectionStatus) => void): () => void {
    return this.ws.onStatus(handler);
  }
}
