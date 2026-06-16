import { tokens } from "../design-system/tokens.js";
import { LatencyMeter } from "./LatencyMeter.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function pitchName(midi: number) {
  const oct = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${oct}`;
}

export interface StatusBarProps {
  selectedNoteCount: number;
  /** MIDI pitches of selected notes — StatusBar derives the display strings. */
  selectedNotePitches?: number[];
  /** MIDI ticks of selected notes (start tick). */
  selectedNoteTicks?: number[];
  quantization: string;
  snap: string;
  tonalKey: string | null;
  mode: string | null;
  tension: number;
  streamLatencyMs: number;
  projectedEarningsUsdc: number;
  poetStatus?: "idle" | "streaming" | "review";
  onPoetStatusClick?: () => void;
}

export function StatusBar({
  selectedNoteCount,
  selectedNotePitches = [],
  selectedNoteTicks = [],
  quantization,
  snap,
  tonalKey,
  mode,
  tension,
  streamLatencyMs,
  projectedEarningsUsdc,
  poetStatus = "idle",
  onPoetStatusClick,
}: StatusBarProps) {
  const keyLabel = tonalKey && mode ? `${tonalKey} ${mode}` : "";

  const pitchRange =
    selectedNotePitches.length > 0
      ? `${pitchName(Math.min(...selectedNotePitches))}–${pitchName(Math.max(...selectedNotePitches))}`
      : "";

  const timeRange =
    selectedNoteTicks.length > 0
      ? `${Math.min(...selectedNoteTicks)}–${Math.max(...selectedNoteTicks)} ticks`
      : "";

  return (
    <footer
      className="flex shrink-0 items-center gap-4 px-3"
      style={{
        height: tokens.spacing.statusBarHeight,
        backgroundColor: tokens.colors.background.surface,
        borderTop: `1px solid ${tokens.colors.border.hairline}`,
        fontSize: tokens.typography.fontSize.xs,
        color: tokens.colors.text.muted,
        fontFamily: tokens.typography.fontFamily.ui,
      }}
    >
      <span>
        {selectedNoteCount > 0 ? `${selectedNoteCount} note${selectedNoteCount === 1 ? "" : "s"}` : "No selection"}
        {timeRange ? ` · ${timeRange}` : ""}
        {pitchRange ? ` · ${pitchRange}` : ""}
      </span>
      <span>Q {quantization}</span>
      <span>Snap {snap}</span>
      {keyLabel && <span>{keyLabel}</span>}
      <span className="flex items-center gap-1">
        Tension
        <span
          style={{
            display: "inline-block",
            width: 40,
            height: 4,
            backgroundColor: tokens.colors.background.canvas,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              display: "block",
              width: `${Math.round(tension * 100)}%`,
              height: "100%",
              backgroundColor: tokens.colors.accent.tension,
            }}
          />
        </span>
      </span>
      <span className="ml-auto flex items-center gap-1">
        Stream <LatencyMeter latencyMs={streamLatencyMs} />
      </span>
      <span style={{ fontFamily: tokens.typography.fontFamily.mono }}>
        ${projectedEarningsUsdc.toFixed(2)} USDC
      </span>
      <button
        type="button"
        onClick={onPoetStatusClick}
        className="w-[120px] text-left"
        style={{
          fontFamily: tokens.typography.fontFamily.mono,
          fontSize: tokens.typography.fontSize.xs,
          color: poetStatus === "review" ? tokens.colors.track.violet : tokens.colors.text.muted,
          background: "transparent",
          border: "none",
          cursor: onPoetStatusClick ? "pointer" : "default",
        }}
      >
        {poetStatus === "streaming" ? (
          <span>
            Poet<span className="animate-poet-pulse">...</span>
          </span>
        ) : poetStatus === "review" ? (
          "Awaiting review"
        ) : (
          "Poet"
        )}
      </button>
    </footer>
  );
}
