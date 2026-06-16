import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Track } from "@consequence/state";
import { usePianoRollStore, useTrackStore, useWorkspaceStore } from "@consequence/state";
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
  onOpenInstrument: () => void;
}

function TrackRow({ track, selected, onOpenInstrument }: TrackRowProps) {
  const { selectTrack, toggleMute, toggleSolo, toggleArm, toggleLock } = useTrackStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: TRACK_ROW_HEIGHT }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        selectTrack(track.id, e.shiftKey || e.metaKey || e.ctrlKey);
        usePianoRollStore.getState().setActiveTrackId(track.id);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onOpenInstrument();
      }}
      style={{
        height: TRACK_ROW_HEIGHT,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        backgroundColor: selected ? tokens.colors.background.elevated : "transparent",
        borderBottom: `1px solid ${tokens.colors.border.hairline}`,
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <span style={{ width: 4, height: 24, backgroundColor: track.color, borderRadius: 2 }} />
      <span
        style={{
          width: 120,
          fontSize: tokens.typography.fontSize.compact,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.text.primary,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={track.instrument}
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
    </motion.div>
  );
}

export function TrackList() {
  const tracks = useTrackStore((s) => s.tracks);
  const selectedTrackIds = useTrackStore((s) => s.selectedTrackIds);
  const addTrack = useTrackStore((s) => s.addTrack);
  const removeTrack = useTrackStore((s) => s.removeTrack);
  const openInstrumentEditor = useWorkspaceStore((s) => s.openInstrumentEditor);
  const dragIndex = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const deleteSelected = useCallback(() => {
    const ids = [...useTrackStore.getState().selectedTrackIds];
    for (const id of ids) {
      removeTrack(id);
    }
  }, [removeTrack]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (selectedTrackIds.length === 0) return;
      e.preventDefault();
      deleteSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected, selectedTrackIds.length]);

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: tokens.colors.background.surface }}>
      <div
        className="flex shrink-0 items-center justify-between px-3"
        style={{
          height: 28,
          borderBottom: `1px solid ${tokens.colors.border.hairline}`,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.text.muted,
        }}
      >
        <span>Tracks</span>
        <div className="flex items-center gap-2">
          {selectedTrackIds.length > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              title="Delete selected tracks"
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.accent.error,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          )}
          <span>{tracks.length}</span>
        </div>
      </div>
      <div
        className="shrink-0"
        style={{
          height: 24,
          borderBottom: `1px solid ${tokens.colors.border.hairline}`,
          background: tokens.colors.background.canvas,
        }}
      />
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {tracks.map((track, index) => (
            <div
              key={track.id}
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex.current !== null && dragIndex.current !== index) {
                  useTrackStore.getState().reorderTrack(dragIndex.current, index);
                }
                dragIndex.current = null;
              }}
            >
              <TrackRow
                track={track}
                selected={selectedTrackIds.includes(track.id)}
                onOpenInstrument={() => openInstrumentEditor(track.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={() => {
          addTrack();
          const id = useTrackStore.getState().selectedTrackIds[0];
          if (id) usePianoRollStore.getState().setActiveTrackId(id);
          requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
          });
        }}
        style={{
          height: 32,
          margin: 8,
          border: `1px solid ${tokens.colors.border.standard}`,
          borderRadius: tokens.borderRadius.sm,
          background: tokens.colors.background.elevated,
          color: tokens.colors.text.secondary,
          fontSize: tokens.typography.fontSize.compact,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        + Add Track
      </button>
    </div>
  );
}
