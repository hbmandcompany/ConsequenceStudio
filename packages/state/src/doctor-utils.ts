import type { DoctorDiagnosticPayload } from "@consequence/stream";
import { TICKS_PER_BEAT } from "./arrangement-utils.js";

export type DoctorPanelMode = "diagnose" | "suggest" | "execute" | "compose";

export type DiagnosticCategory = DoctorDiagnosticPayload["category"];

export const DIAGNOSTIC_CATEGORIES: DiagnosticCategory[] = [
  "harmonic",
  "melodic",
  "rhythmic",
  "structural",
];

export function barBeatToTick(
  bar: number,
  beat: number,
  timeSignature: [number, number],
): number {
  const beatsPerBar = timeSignature[0];
  return Math.max(0, ((bar - 1) * beatsPerBar + (beat - 1)) * TICKS_PER_BEAT);
}

export function groupDiagnosticsByCategory(
  diagnostics: DoctorDiagnosticPayload[],
): Record<DiagnosticCategory, DoctorDiagnosticPayload[]> {
  const groups: Record<DiagnosticCategory, DoctorDiagnosticPayload[]> = {
    harmonic: [],
    melodic: [],
    rhythmic: [],
    structural: [],
  };
  for (const diagnostic of diagnostics) {
    groups[diagnostic.category].push(diagnostic);
  }
  return groups;
}
