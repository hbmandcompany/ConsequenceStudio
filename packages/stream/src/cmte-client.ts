import type { StreamConfig } from "./config.js";
import { projectAnalysisPanel } from "./analysis-panel-projection.js";
import type { KeyChangeEntry } from "./analysis-panel-types.js";
import type { CmteAnalysisPayload, ConnectionStatus, TheoryMonteCarloPayload } from "./types.js";
import { TheoryEngineClient } from "./theory-engine-client.js";
import type { TheoryAnalysisFrame, TheoryMidiInputEvent } from "./theory-types.js";

/** CMTE client backed by the Consequence Theory Engine HTTP/WS API. */
export class CmteClient {
  private readonly engine: TheoryEngineClient;
  private frameHandlers = new Set<(frame: TheoryAnalysisFrame) => void>();
  private summaryHandlers = new Set<(summary: CmteAnalysisPayload) => void>();
  private monteCarloHandlers = new Set<(output: TheoryMonteCarloPayload) => void>();
  private statusHandlers = new Set<(status: ConnectionStatus) => void>();
  private unsubs: Array<() => void> = [];
  private modulationHistory: KeyChangeEntry[] = [];
  private previousPhraseBeats: number | null = null;

  constructor(config: StreamConfig) {
    this.engine = new TheoryEngineClient({
      httpBaseUrl: config.theoryEngineHttpUrl,
      authToken: config.theoryEngineAuthToken,
      hubMode: config.streamHubMode,
    });
  }

  get engineClient(): TheoryEngineClient {
    return this.engine;
  }

  async connect(sessionId?: string): Promise<void> {
    this.bindEngine();
    await this.engine.connect(sessionId);
  }

  connectSync(): void {
    this.bindEngine();
    void this.engine.connect();
  }

  disconnect(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.engine.disconnect();
  }

  getStatus(): ConnectionStatus {
    return this.engine.getStatus();
  }

  async postEvents(events: TheoryMidiInputEvent[]): Promise<number> {
    return this.engine.postEvents(events);
  }

  onAnalysisFrame(handler: (frame: CmteAnalysisPayload) => void): () => void {
    this.bindEngine();
    this.summaryHandlers.add(handler);
    return () => this.summaryHandlers.delete(handler);
  }

  onTheoryFrame(handler: (frame: TheoryAnalysisFrame) => void): () => void {
    this.bindEngine();
    this.frameHandlers.add(handler);
    return () => this.frameHandlers.delete(handler);
  }

  onMonteCarloOutput(handler: (output: TheoryMonteCarloPayload) => void): () => void {
    this.bindEngine();
    this.monteCarloHandlers.add(handler);
    return () => this.monteCarloHandlers.delete(handler);
  }

  onStatus(handler: (status: ConnectionStatus) => void): () => void {
    this.bindEngine();
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  /** Test helper — simulate a theory frame without a live engine. */
  simulateFrame(frame: TheoryAnalysisFrame): void {
    this.bindEngine();
    this.engine.simulateFrame(frame);
  }

  private bindEngine(): void {
    if (this.unsubs.length > 0) return;
    this.unsubs.push(
      this.engine.onFrame((frame) => {
        const summary = TheoryEngineClient.toCmteSummary(frame);
        const payload: CmteAnalysisPayload = {
          key: summary.key,
          mode: summary.mode,
          chord: summary.chord ?? "—",
          roman_numeral: summary.roman_numeral,
          tension: summary.tension,
          confidence: summary.confidence,
          tonal_ambiguity: summary.tonal_ambiguity,
        };
        for (const handler of this.summaryHandlers) handler(payload);
        for (const handler of this.frameHandlers) handler(frame);
        if (frame.monte_carlo_output) {
          const analysis_panel = projectAnalysisPanel(frame, {
            modulation_history: this.modulationHistory,
            previous_phrase_beats: this.previousPhraseBeats,
          });
          this.modulationHistory = analysis_panel.tonal.modulation_history;
          this.previousPhraseBeats = frame.melodic_analysis.phrase_length_beats;
          const montePayload: TheoryMonteCarloPayload = {
            frame_id: frame.frame_id,
            session_id: frame.session_id,
            tick: frame.tick,
            monte_carlo_output: frame.monte_carlo_output,
            analysis_panel,
            summary: payload,
          };
          for (const handler of this.monteCarloHandlers) handler(montePayload);
        }
      }),
    );
    this.unsubs.push(this.engine.onStatus((status) => {
      for (const handler of this.statusHandlers) handler(status);
    }));
  }
}
