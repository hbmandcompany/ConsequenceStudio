import type { StreamConfig } from "./config.js";
import type {
  ConnectionStatus,
  DoctorDiagnosticPayload,
  DoctorSuggestionPayload,
} from "./types.js";
import { WebSocketClient } from "./ws-client.js";

/** ConsequenceDoctor diagnostic and suggestion client. */
export class DoctorClient {
  private readonly ws = new WebSocketClient();

  constructor(private readonly config: StreamConfig) {}

  connect(): void {
    this.ws.connect(this.config.doctorWsUrl);
  }

  disconnect(): void {
    this.ws.disconnect();
  }

  getStatus(): ConnectionStatus {
    return this.ws.getStatus();
  }

  onDiagnostic(handler: (diagnostic: DoctorDiagnosticPayload) => void): () => void {
    return this.ws.onMessage((event) => {
      if (event.event_type === "doctor_diagnostic_event") {
        handler(event.payload);
      }
    });
  }

  onSuggestion(handler: (suggestion: DoctorSuggestionPayload) => void): () => void {
    return this.ws.onMessage((event) => {
      if (event.event_type === "doctor_suggestion_event") {
        handler(event.payload);
      }
    });
  }

  sendInstruction(instruction: string): void {
    this.ws.send({ command: "execute", instruction });
  }

  rejectSuggestion(suggestionId: string): void {
    this.ws.send({ command: "reject_suggestion", suggestion_id: suggestionId });
  }

  onStatus(handler: (status: ConnectionStatus) => void): () => void {
    return this.ws.onStatus(handler);
  }
}
