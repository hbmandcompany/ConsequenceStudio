import { loadStreamConfig, type StreamConfig } from "./config.js";
import { CmteClient } from "./cmte-client.js";
import { DoctorClient } from "./doctor-client.js";
import { FloppydiskClient } from "./floppydisk-client.js";
import { LedgerClient } from "./ledger-client.js";
import { PoetStreamClient } from "./poet-client.js";
import type { GetMusicalContext, OnPoetConnectionState, OnPoetNotification } from "./poet-client.js";
import type { EcosystemStreamEnvelope } from "./ecosystem-stream.js";
import { StreamClient } from "./stream-client.js";
import type { ConnectionStatus } from "./types.js";
import type { UnifiedStreamEvent } from "./types.js";

export type ServiceName =
  | "consequenceStream"
  | "cmte"
  | "doctor"
  | "ledger"
  | "floppydisk"
  | "poet";

export type ConnectionMap = Record<ServiceName, ConnectionStatus>;

/** Merges all backend streams into a single typed event stream. */
export class UnifiedStream {
  readonly stream: StreamClient;
  readonly cmte: CmteClient;
  readonly doctor: DoctorClient;
  readonly ledger: LedgerClient;
  readonly floppydisk: FloppydiskClient;
  readonly poet: PoetStreamClient;

  private readonly config: StreamConfig;
  private listeners = new Set<(event: UnifiedStreamEvent) => void>();
  private statusListeners = new Set<(status: ConnectionMap) => void>();
  private unsubs: Array<() => void> = [];

  constructor(
    config: StreamConfig = loadStreamConfig(),
    poetOptions?: {
      getMusicalContext: GetMusicalContext;
      onConnectionState?: OnPoetConnectionState;
      onNotification?: OnPoetNotification;
    },
  ) {
    this.config = config;
    this.stream = new StreamClient(config);
    this.cmte = new CmteClient(config);
    this.doctor = new DoctorClient(config);
    this.ledger = new LedgerClient(config);
    this.floppydisk = new FloppydiskClient(config);
    this.poet = new PoetStreamClient(
      config,
      poetOptions?.getMusicalContext ?? (() => ({
        current_bar: 1,
        current_beat: 1,
        current_key_root: 0,
        current_key_mode: "major",
        harmonic_tension: 0.3,
        rhythmic_density: 0.5,
        melodic_contour: "flat",
        structural_position: "unknown",
        tempo_bpm: 120,
        time_signature_numerator: 4,
        time_signature_denominator: 4,
        bars_in_current_section: 4,
        is_stale: true,
      })),
      poetOptions?.onConnectionState,
      poetOptions?.onNotification,
    );
  }

  connectPoet(sessionId: string): void {
    this.poet.connect(sessionId);
    this.bindPoetForwarding();
  }

  connectAll(): void {
    if (this.streamEnabled()) this.stream.connect();
    this.doctor.connect();
    if (this.ledgerEnabled()) this.ledger.connect();
    this.floppydisk.connect();
    this.bindForwarding();
    this.bindStatusForwarding();
  }

  streamEnabled(): boolean {
    return this.config.studioEnableStream;
  }

  ledgerEnabled(): boolean {
    return this.config.studioEnableLedger;
  }

  /** Publish audit events to ConsequenceStream when enabled. */
  publishAudit(envelope: EcosystemStreamEnvelope): void {
    if (!this.streamEnabled()) return;
    this.stream.publishAudit(envelope);
  }

  disconnectAll(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.stream.disconnect();
    this.cmte.disconnect();
    this.doctor.disconnect();
    this.ledger.disconnect();
    this.floppydisk.disconnect();
    this.poet.disconnect();
    this.notifyStatus();
  }

  subscribe(listener: (event: UnifiedStreamEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onConnectionStatus(listener: (status: ConnectionMap) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getConnectionStatus());
    return () => this.statusListeners.delete(listener);
  }

  getConnectionStatus(): ConnectionMap {
    return {
      consequenceStream: this.stream.getStatus(),
      cmte: this.cmte.getStatus(),
      doctor: this.doctor.getStatus(),
      ledger: this.ledger.getStatus(),
      floppydisk: this.floppydisk.getStatus(),
      poet: this.poet.getStatus(),
    };
  }

  /** Emit an event directly — used by replay engine and tests. */
  emit(event: UnifiedStreamEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private bindPoetForwarding(): void {
    const forward = (event: UnifiedStreamEvent) => this.emit(event);
    this.unsubs.push(this.poet.onEvent(forward));
    this.unsubs.push(this.poet.onStatus(() => this.notifyStatus()));
  }

  private bindForwarding(): void {
    const forward = (event: UnifiedStreamEvent) => this.emit(event);

    this.unsubs.push(
      this.stream.onEvent((event) => {
        if (
          event.event_type === "midi_note_event" ||
          event.event_type === "transport_state_event" ||
          event.event_type === "collaboration_presence_event" ||
          event.event_type === "collaboration_chat_event"
        ) {
          forward(event);
        }
      }),
    );

    this.unsubs.push(
      this.cmte.onAnalysisFrame((p) => forward({ event_type: "cmte_analysis_frame", payload: p })),
    );
    this.unsubs.push(
      this.cmte.onMonteCarloOutput((p) =>
        forward({ event_type: "theory_monte_carlo_frame", payload: p }),
      ),
    );
    this.unsubs.push(
      this.doctor.onDiagnostic((p) =>
        forward({ event_type: "doctor_diagnostic_event", payload: p }),
      ),
    );
    this.unsubs.push(
      this.doctor.onSuggestion((p) =>
        forward({ event_type: "doctor_suggestion_event", payload: p }),
      ),
    );
    this.unsubs.push(
      this.ledger.onUpdate((p) => forward({ event_type: "ledger_update_event", payload: p })),
    );
    this.unsubs.push(
      this.floppydisk.onAssetEvent((p) =>
        forward({ event_type: "floppydisk_asset_event", payload: p }),
      ),
    );
  }

  private bindStatusForwarding(): void {
    const services = [
      this.stream,
      this.cmte,
      this.doctor,
      this.ledger,
      this.floppydisk,
      this.poet,
    ] as const;
    for (const service of services) {
      this.unsubs.push(service.onStatus(() => this.notifyStatus()));
    }
  }

  private notifyStatus(): void {
    const status = this.getConnectionStatus();
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}
