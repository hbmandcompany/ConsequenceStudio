import type { StreamConfig } from "./config.js";
import type { ConnectionStatus, FloppydiskAssetPayload } from "./types.js";
import { WebSocketClient } from "./ws-client.js";

export interface AssetSearchResult {
  asset_id: string;
  name: string;
  asset_type: string;
  size_bytes: number;
  similarity: number;
}

/** ConsequenceFloppydisk HTTP and WebSocket asset client. */
export class FloppydiskClient {
  private readonly ws = new WebSocketClient();

  constructor(private readonly config: StreamConfig) {}

  connect(): void {
    this.ws.connect(this.config.floppydiskWsUrl);
  }

  disconnect(): void {
    this.ws.disconnect();
  }

  getStatus(): ConnectionStatus {
    return this.ws.getStatus();
  }

  async search(query: string): Promise<AssetSearchResult[]> {
    const response = await fetch(`${this.config.floppydiskHttpUrl}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error(`Floppydisk search failed: ${response.status}`);
    }
    const data = (await response.json()) as { results: AssetSearchResult[] };
    return data.results;
  }

  onAssetEvent(handler: (event: FloppydiskAssetPayload) => void): () => void {
    return this.ws.onMessage((event) => {
      if (event.event_type === "floppydisk_asset_event") {
        handler(event.payload);
      }
    });
  }

  onStatus(handler: (status: ConnectionStatus) => void): () => void {
    return this.ws.onStatus(handler);
  }
}
