import { WebSocketServer, type WebSocket } from "ws";
import type { UnifiedStreamEvent } from "../types.js";

export interface MockStreamServer {
  port: number;
  url: string;
  broadcast: (event: UnifiedStreamEvent) => void;
  close: () => Promise<void>;
}

/** Lightweight WebSocket mock server for Vitest and Playwright. */
export function createMockStreamServer(port = 0): Promise<MockStreamServer> {
  return new Promise((resolve, reject) => {
    const clients = new Set<WebSocket>();
    const wss = new WebSocketServer({ port, host: "127.0.0.1" }, () => {
      const address = wss.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to bind mock stream server"));
        wss.close();
        return;
      }

      const resolvedPort = address.port;
      resolve({
        port: resolvedPort,
        url: `ws://127.0.0.1:${resolvedPort}`,
        broadcast: (event: UnifiedStreamEvent) => {
          const data = JSON.stringify(event);
          for (const client of clients) {
            if (client.readyState === 1) client.send(data);
          }
        },
        close: () =>
          new Promise<void>((res, rej) => {
            for (const client of clients) client.close();
            wss.close((err) => (err ? rej(err) : res()));
          }),
      });
    });

    wss.on("connection", (ws) => {
      clients.add(ws);
      ws.on("close", () => clients.delete(ws));
    });

    wss.on("error", reject);
  });
}
