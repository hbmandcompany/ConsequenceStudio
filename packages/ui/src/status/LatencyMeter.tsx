import { tokens } from "../design-system/tokens.js";

interface LatencyMeterProps {
  latencyMs: number;
}

export function LatencyMeter({ latencyMs }: LatencyMeterProps) {
  return (
    <span
      style={{
        fontFamily: tokens.typography.fontFamily.mono,
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.text.muted,
      }}
    >
      {latencyMs}ms
    </span>
  );
}
