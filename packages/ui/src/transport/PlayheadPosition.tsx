import { tokens } from "../design-system/tokens.js";
import { formatPlayheadPosition } from "./transport-utils.js";

interface PlayheadPositionProps {
  positionTicks: number;
  timeSignature: [number, number];
}

export function PlayheadPosition({ positionTicks, timeSignature }: PlayheadPositionProps) {
  return (
    <span
      style={{
        fontFamily: tokens.typography.fontFamily.mono,
        fontSize: tokens.typography.fontSize.compact,
        color: tokens.colors.text.primary,
        minWidth: 72,
        textAlign: "center",
      }}
    >
      {formatPlayheadPosition(positionTicks, timeSignature)}
    </span>
  );
}
