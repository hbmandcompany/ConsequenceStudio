import type { LLMIntentSignal, SupervisionAction } from "./poet-types.js";

export type EcosystemStreamEventType =
  | "LLMIntentSignal"
  | "SupervisionAction"
  | "CMTEAnalysisFrame"
  | "TransportStateEvent"
  | "PoetryGenerationEvent"
  | "PoetToken"
  | "AIUsageEvent";

export interface EcosystemStreamEnvelope<T = unknown> {
  event_type: EcosystemStreamEventType;
  schema_version: 1;
  lamport_timestamp: number;
  session_id: string;
  payload: T;
}

let lamportCounter = 0;

export function nextLamportTimestamp(): number {
  lamportCounter += 1;
  return lamportCounter;
}

export function buildIntentEnvelope(signal: LLMIntentSignal): EcosystemStreamEnvelope<LLMIntentSignal> {
  return {
    event_type: "LLMIntentSignal",
    schema_version: 1,
    lamport_timestamp: nextLamportTimestamp(),
    session_id: signal.session_id,
    payload: signal,
  };
}

export function buildSupervisionEnvelope(
  action: SupervisionAction,
): EcosystemStreamEnvelope<SupervisionAction> {
  return {
    event_type: "SupervisionAction",
    schema_version: 1,
    lamport_timestamp: nextLamportTimestamp(),
    session_id: action.session_id,
    payload: action,
  };
}

/** Publish ecosystem audit events when Stream is enabled. */
export function publishEcosystemEvent(
  stream: { publishAudit?: (envelope: EcosystemStreamEnvelope) => void } | null | undefined,
  envelope: EcosystemStreamEnvelope,
): void {
  stream?.publishAudit?.(envelope);
}
