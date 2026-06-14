import { useCallback, useEffect, useRef, useState } from "react";
import {
  useWorkspaceStore,
  useTheoryStore,
  useArrangementStore,
  usePianoRollStore,
  useSessionStore,
  useTrackStore,
} from "@consequence/state";
import { yToPitch } from "@consequence/audio";
import { ResizeHandle } from "@consequence/ui";
import { tokens } from "@consequence/ui/design-system";
import { ArrangementView } from "./arrangement/ArrangementView";
import { TheoryVisualization } from "./TheoryVisualization";
import { PianoRollView } from "./piano-roll/PianoRollView";
import { useFloppydiskDropZone } from "./floppydisk-drop";

const ARRANGEMENT_RULER_HEIGHT = 24;

export function CanvasArea() {
  const arrangementRatio = useWorkspaceStore((s) => s.arrangementRatio);
  const setArrangementRatio = useWorkspaceStore((s) => s.setArrangementRatio);
  const pianoRollVisible = useWorkspaceStore((s) => s.pianoRollVisible);
  const monteCarlo = useTheoryStore((s) => s.monteCarlo);
  const pixelsPerBar = useArrangementStore((s) => s.pixelsPerBar);
  const arrangementScrollX = useArrangementStore((s) => s.scrollX);
  const activeTool = usePianoRollStore((s) => s.activeTool);
  const setActiveTool = usePianoRollStore((s) => s.setActiveTool);
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

  return (
    <div
      id="canvas-split"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ backgroundColor: tokens.colors.background.canvas }}
    >
      <div className="flex min-h-0 flex-col" style={{ flex: pianoRollVisible ? arrangementRatio : 1 }}>
        <div
          className="flex shrink-0 items-center justify-between px-3"
          style={{
            height: 28,
            borderBottom: `1px solid ${tokens.colors.border.hairline}`,
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.text.muted,
          }}
        >
          <span>Arrangement</span>
          <span>
            Zoom {(pixelsPerBar / 120).toFixed(1)}x
            {monteCarlo ? ` · CMTE ${monteCarlo.chord_paths.length} paths` : ""}
          </span>
        </div>
        <div
          ref={arrangementRef}
          className="relative min-h-0 flex-1 overflow-hidden"
          onDragOver={arrangementDrop.onDragOver}
          onDrop={arrangementDrop.onDrop}
        >
          <ArrangementView width={arrangementSize.width} height={arrangementSize.height} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ mixBlendMode: "screen", opacity: 0.55 }}
          >
            <TheoryVisualization monteCarlo={monteCarlo} width={arrangementSize.width} height={arrangementSize.height} />
          </div>
        </div>
      </div>

      {pianoRollVisible ? (
      <div onMouseDown={() => { startRatio.current = arrangementRatio; }}>
        <ResizeHandle orientation="horizontal" onResizeDelta={onResizeDelta} />
      </div>
      ) : null}

      {pianoRollVisible ? (
      <div className="flex min-h-0 flex-col" style={{ flex: 1 - arrangementRatio }}>
        <div
          className="flex shrink-0 items-center justify-between px-3"
          style={{
            height: 28,
            borderBottom: `1px solid ${tokens.colors.border.hairline}`,
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.text.muted,
          }}
        >
          <span>Piano Roll</span>
          <div className="flex gap-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                style={{
                  color: activeTool === tool.id ? tokens.colors.text.accent : tokens.colors.text.muted,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: tokens.typography.fontSize.compact,
                }}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </div>
        <div
          ref={pianoRef}
          className="min-h-0 flex-1 overflow-hidden"
          onDragOver={pianoDrop.onDragOver}
          onDrop={pianoDrop.onDrop}
        >
          <PianoRollView width={pianoSize.width} height={pianoSize.height} />
        </div>
      </div>
      ) : null}
    </div>
  );
}
