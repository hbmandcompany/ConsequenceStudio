import { useRef } from "react";
import type { Track } from "@consequence/state";
import { useTrackStore } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

const TRACK_ROW_HEIGHT = tokens.spacing.trackRowHeight;

function TrackTypeIcon({ type }: { type: Track["type"] }) {
  const label = type === "midi" ? "M" : type === "audio" ? "A" : "I";
  return (
    <span
      style={{
        width: 16,
        height: 16,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        color: tokens.colors.text.muted,
        border: `1px solid ${tokens.colors.border.standard}`,
        borderRadius: 2,
      }}
    >
      {label}
    </span>
  );
}

function LevelMeter({ peak, rms }: { peak: number; rms: number }) {
  return (
    <div
      style={{
        width: 40,
        height: 12,
        backgroundColor: tokens.colors.background.canvas,
        borderRadius: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: `${Math.round(rms * 100)}%`,
          height: "40%",
          backgroundColor: tokens.colors.text.muted,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: `${Math.round(peak * 100)}%`,
          height: "100%",
          backgroundColor: tokens.colors.accent.platform,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

interface TrackRowProps {
  track: Track;
  selected: boolean;
}

function TrackRow({ track, selected }: TrackRowProps) {
  const { selectTrack, toggleMute, toggleSolo, toggleArm, toggleLock } = useTrackStore();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => selectTrack(track.id, e.shiftKey || e.metaKey || e.ctrlKey)}
      style={{
        height: TRACK_ROW_HEIGHT,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        backgroundColor: selected ? tokens.colors.background.elevated : "transparent",
        borderBottom: `1px solid ${tokens.colors.border.hairline}`,
        cursor: "pointer",
      }}
    >
      <span style={{ width: 4, height: 24, backgroundColor: track.color, borderRadius: 2 }} />
      <span
        style={{
          width: 140,
          fontSize: tokens.typography.fontSize.compact,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.text.primary,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.name}
      </span>
      {(["M", "S", "R", "L"] as const).map((label, i) => {
        const active = [track.muted, track.solo, track.armed, track.locked][i];
        const handler = [toggleMute, toggleSolo, toggleArm, toggleLock][i];
        return (
          <button
            key={label}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handler(track.id);
            }}
            style={{
              width: 20,
              height: 20,
              fontSize: 10,
              border: `1px solid ${active ? tokens.colors.border.active : tokens.colors.border.standard}`,
              borderRadius: tokens.borderRadius.xs,
              background: active ? tokens.colors.background.elevated : "transparent",
              color: active ? tokens.colors.text.accent : tokens.colors.text.muted,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
      <LevelMeter peak={track.peakLevel} rms={track.rmsLevel} />
      <TrackTypeIcon type={track.type} />
    </div>
  );
}

export function TrackList() {
  const tracks = useTrackStore((s) => s.tracks);
  const selectedTrackIds = useTrackStore((s) => s.selectedTrackIds);
  const addTrack = useTrackStore((s) => s.addTrack);
  const dragIndex = useRef<number | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ backgroundColor: tokens.colors.background.surface }}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            draggable
            onDragStart={() => { dragIndex.current = index; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex.current !== null && dragIndex.current !== index) {
                useTrackStore.getState().reorderTrack(dragIndex.current, index);
              }
              dragIndex.current = null;
            }}
          >
            <TrackRow track={track} selected={selectedTrackIds.includes(track.id)} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addTrack()}
        style={{
          height: 32,
          margin: 8,
          border: `1px solid ${tokens.colors.border.standard}`,
          borderRadius: tokens.borderRadius.sm,
          background: tokens.colors.background.elevated,
          color: tokens.colors.text.secondary,
          fontSize: tokens.typography.fontSize.compact,
          cursor: "pointer",
        }}
      >
        + Add Track
      </button>
    </div>
  );
}
