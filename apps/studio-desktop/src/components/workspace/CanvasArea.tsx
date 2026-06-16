import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  useWorkspaceStore,
  useArrangementStore,
  usePianoRollStore,
  useSessionStore,
  useTrackStore,
  QUANTIZE_VALUES,
} from "@consequence/state";
import { yToPitch } from "@consequence/audio";
import { ResizeHandle } from "@consequence/ui";
import { tokens } from "@consequence/ui/design-system";
import { ArrangementView } from "./arrangement/ArrangementView";
import { PianoRollView } from "./piano-roll/PianoRollView";
import { ScoreView } from "./piano-roll/ScoreView";
import { TypingPianoModal } from "./typing-piano/TypingPianoModal";
import { useFloppydiskDropZone } from "./floppydisk-drop";

const ARRANGEMENT_RULER_HEIGHT = 24;
const SECTION_HEADER_HEIGHT = 28;

const cardStyle = {
  display: "flex",
  flexDirection: "column" as const,
  minHeight: 0,
  background: tokens.colors.background.surface,
  border: `1px solid ${tokens.colors.border.hairline}`,
  borderRadius: tokens.borderRadius.lg,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(0,0,0,0.22)",
};

function SectionHeader({
  title,
  titleAction,
  children,
}: {
  title: string;
  titleAction?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-3"
      style={{
        height: SECTION_HEADER_HEIGHT,
        borderBottom: `1px solid ${tokens.colors.border.hairline}`,
        background: tokens.colors.background.elevated,
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.text.muted,
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.text.secondary }}>
          {title}
        </span>
        {titleAction}
      </div>
      {children}
    </div>
  );
}

export function CanvasArea() {
  const arrangementRatio = useWorkspaceStore((s) => s.arrangementRatio);
  const setArrangementRatio = useWorkspaceStore((s) => s.setArrangementRatio);
  const pianoRollVisible = useWorkspaceStore((s) => s.pianoRollVisible);
  const quantization = useWorkspaceStore((s) => s.quantization);
  const setQuantization = useWorkspaceStore((s) => s.setQuantization);
  const snapEnabled = useWorkspaceStore((s) => s.snapEnabled);
  const toggleSnap = useWorkspaceStore((s) => s.toggleSnap);
  const pianoRollViewMode = useWorkspaceStore((s) => s.pianoRollViewMode);
  const setPianoRollViewMode = useWorkspaceStore((s) => s.setPianoRollViewMode);
  const openTypingPiano = useWorkspaceStore((s) => s.openTypingPiano);
  const pixelsPerBar = useArrangementStore((s) => s.pixelsPerBar);
  const arrangementScrollX = useArrangementStore((s) => s.scrollX);
  const activeTool = usePianoRollStore((s) => s.activeTool);
  const setActiveTool = usePianoRollStore((s) => s.setActiveTool);
  const selectedNoteIds = usePianoRollStore((s) => s.selectedNoteIds);
  const quantizeNotes = usePianoRollStore((s) => s.quantizeNotes);
  const pianoPixelsPerBar = usePianoRollStore((s) => s.pixelsPerBar);
  const pianoScrollX = usePianoRollStore((s) => s.scrollX);
  const pianoScrollY = usePianoRollStore((s) => s.scrollY);
  const pianoRowHeight = usePianoRollStore((s) => s.rowHeight);
  const tracks = useTrackStore((s) => s.tracks);
  const timeSignature = useSessionStore((s) => s.timeSignature);
  const startRatio = useRef(arrangementRatio);
  const arrangementRef = useRef<HTMLDivElement>(null);
  const pianoRef = useRef<HTMLDivElement>(null);
  const [arrangementSize, setArrangementSize] = useState({ width: 640, height: 240 });
  const [pianoSize, setPianoSize] = useState({ width: 640, height: 240 });

  const resolveArrangementTrack = useCallback(
    (clientY: number, rectTop: number) => {
      const relativeY = clientY - rectTop - ARRANGEMENT_RULER_HEIGHT;
      const index = Math.floor(relativeY / tokens.spacing.trackRowHeight);
      return tracks[Math.max(0, Math.min(tracks.length - 1, index))]?.id;
    },
    [tracks],
  );

  const resolvePianoPitch = useCallback(
    (clientY: number, rectTop: number) => {
      const localY = clientY - rectTop;
      return yToPitch(localY, pianoRowHeight, pianoScrollY);
    },
    [pianoRowHeight, pianoScrollY],
  );

  const arrangementDrop = useFloppydiskDropZone({
    target: "arrangement",
    pixelsPerBar,
    timeSignature,
    scrollX: arrangementScrollX,
    resolveTrackId: resolveArrangementTrack,
  });

  const pianoDrop = useFloppydiskDropZone({
    target: "piano-roll",
    pixelsPerBar: pianoPixelsPerBar,
    timeSignature,
    scrollX: pianoScrollX,
    xOffset: tokens.spacing.pianoKeyboardWidth,
    resolvePitch: resolvePianoPitch,
  });

  useEffect(() => {
    const el = arrangementRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setArrangementSize({ width: Math.max(200, width), height: Math.max(120, height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = pianoRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPianoSize({ width: Math.max(200, width), height: Math.max(120, height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onResizeDelta = (delta: number) => {
    const container = document.getElementById("canvas-split");
    if (!container) return;
    const total = container.clientHeight;
    const next = Math.min(0.9, Math.max(0.25, startRatio.current + delta / total));
    setArrangementRatio(next);
  };

  const tools: Array<{ id: typeof activeTool; label: string }> = [
    { id: "pointer", label: "Pointer" },
    { id: "pencil", label: "Pencil" },
    { id: "eraser", label: "Eraser" },
  ];

  const viewToggleStyle = (active: boolean) => ({
    color: active ? tokens.colors.text.accent : tokens.colors.text.muted,
    background: active ? tokens.colors.background.surface : "transparent",
    border: `1px solid ${active ? tokens.colors.border.active : tokens.colors.border.standard}`,
    borderRadius: tokens.borderRadius.sm,
    padding: "2px 8px",
    cursor: "pointer" as const,
    fontSize: tokens.typography.fontSize.compact,
  });

  return (
    <div
      id="canvas-split"
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      style={{ backgroundColor: tokens.colors.background.canvas, padding: "6px 8px 8px" }}
    >
      <div style={{ ...cardStyle, flex: pianoRollVisible ? arrangementRatio : 1 }}>
        <SectionHeader title="Arrangement">
          <span style={{ fontFamily: tokens.typography.fontFamily.mono }}>
            Zoom {(pixelsPerBar / 120).toFixed(1)}x
          </span>
        </SectionHeader>
        <div
          ref={arrangementRef}
          className="relative min-h-0 flex-1 overflow-hidden"
          onDragOver={arrangementDrop.onDragOver}
          onDrop={arrangementDrop.onDrop}
        >
          <ArrangementView width={arrangementSize.width} height={arrangementSize.height} />
        </div>
      </div>

      {pianoRollVisible ? (
        <div onMouseDown={() => { startRatio.current = arrangementRatio; }}>
          <ResizeHandle orientation="horizontal" onResizeDelta={onResizeDelta} />
        </div>
      ) : null}

      {pianoRollVisible ? (
        <div style={{ ...cardStyle, flex: 1 - arrangementRatio }}>
          <SectionHeader
            title="Piano Roll"
            titleAction={
              <button
                type="button"
                onClick={openTypingPiano}
                title="Open typing piano keyboard"
                style={{
                  color: tokens.colors.text.accent,
                  background: tokens.colors.background.canvas,
                  border: `1px solid ${tokens.colors.border.standard}`,
                  borderRadius: tokens.borderRadius.sm,
                  padding: "1px 8px",
                  cursor: "pointer",
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Typing Piano
              </button>
            }
          >
            <div className="flex items-center gap-3">
              {pianoRollViewMode === "midi" ? (
                <div className="flex items-center gap-1">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTool(tool.id)}
                      style={{
                        color: activeTool === tool.id ? tokens.colors.text.accent : tokens.colors.text.muted,
                        background: activeTool === tool.id ? tokens.colors.background.surface : "transparent",
                        border: `1px solid ${activeTool === tool.id ? tokens.colors.border.active : "transparent"}`,
                        borderRadius: tokens.borderRadius.sm,
                        padding: "2px 8px",
                        cursor: "pointer",
                        fontSize: tokens.typography.fontSize.compact,
                      }}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {pianoRollViewMode === "midi" ? (
                <span style={{ width: 1, height: 16, background: tokens.colors.border.hairline }} />
              ) : null}

              <label className="flex items-center gap-1" style={{ color: tokens.colors.text.muted }}>
                <span style={{ fontSize: tokens.typography.fontSize.xs }}>Quantize</span>
                <select
                  value={quantization}
                  onChange={(e) => setQuantization(e.target.value as (typeof QUANTIZE_VALUES)[number])}
                  style={{
                    background: tokens.colors.background.canvas,
                    color: tokens.colors.text.primary,
                    border: `1px solid ${tokens.colors.border.standard}`,
                    borderRadius: tokens.borderRadius.xs,
                    fontSize: tokens.typography.fontSize.xs,
                    padding: "1px 4px",
                    cursor: "pointer",
                  }}
                >
                  {QUANTIZE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => quantizeNotes(selectedNoteIds)}
                title="Quantize selected notes (or all if none selected)"
                style={{
                  color: tokens.colors.text.accent,
                  background: tokens.colors.background.surface,
                  border: `1px solid ${tokens.colors.border.standard}`,
                  borderRadius: tokens.borderRadius.sm,
                  padding: "2px 8px",
                  cursor: "pointer",
                  fontSize: tokens.typography.fontSize.compact,
                }}
              >
                Q
              </button>

              <button
                type="button"
                onClick={toggleSnap}
                aria-pressed={snapEnabled}
                title="Snap to grid"
                style={viewToggleStyle(snapEnabled)}
              >
                Snap
              </button>

              <span style={{ width: 1, height: 16, background: tokens.colors.border.hairline }} />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPianoRollViewMode("score")}
                  aria-pressed={pianoRollViewMode === "score"}
                  title="Score view"
                  style={viewToggleStyle(pianoRollViewMode === "score")}
                >
                  Score
                </button>
                <button
                  type="button"
                  onClick={() => setPianoRollViewMode("midi")}
                  aria-pressed={pianoRollViewMode === "midi"}
                  title="MIDI piano roll view"
                  style={viewToggleStyle(pianoRollViewMode === "midi")}
                >
                  MIDI
                </button>
              </div>
            </div>
          </SectionHeader>
          <div
            ref={pianoRef}
            className="min-h-0 flex-1 overflow-hidden"
            onDragOver={pianoRollViewMode === "midi" ? pianoDrop.onDragOver : undefined}
            onDrop={pianoRollViewMode === "midi" ? pianoDrop.onDrop : undefined}
          >
            {pianoRollViewMode === "midi" ? (
              <PianoRollView width={pianoSize.width} height={pianoSize.height} />
            ) : (
              <ScoreView width={pianoSize.width} height={pianoSize.height} />
            )}
          </div>
        </div>
      ) : null}

      <TypingPianoModal />
    </div>
  );
}
