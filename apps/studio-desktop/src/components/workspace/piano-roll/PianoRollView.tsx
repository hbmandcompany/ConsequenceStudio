import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  PianoRollRenderer,
  pixelsPerTick,
  pitchToY,
  tickToX,
  xToTick,
  yToPitch,
  type PianoRollRenderNote,
} from "@consequence/audio";
import {
  useDoctorStore,
  usePianoRollStore,
  useSessionStore,
  useTrackStore,
  useTheoryStore,
} from "@consequence/state";
import { isPitchClassOutOfKey } from "@consequence/stream";
import { tokens } from "@consequence/ui/design-system";
import { PianoKeyboard } from "./PianoKeyboard";
import { DoctorGhostOverlay } from "./DoctorGhostOverlay";
import { acceptDoctorSuggestion, rejectDoctorSuggestion } from "../doctor-actions";

const VELOCITY_LANE_HEIGHT = tokens.spacing.velocityLaneHeight;

function hitTestNote(
  notes: PianoRollRenderNote[],
  x: number,
  y: number,
  pixelsPerBar: number,
  rowHeight: number,
  scrollX: number,
  scrollY: number,
  timeSignature: [number, number],
): PianoRollRenderNote | null {
  const ppt = pixelsPerTick(pixelsPerBar, timeSignature);
  for (let i = notes.length - 1; i >= 0; i -= 1) {
    const note = notes[i];
    const nx = tickToX(note.tick, pixelsPerBar, timeSignature, scrollX);
    const ny = pitchToY(note.pitch, rowHeight, scrollY);
    const nw = Math.max(3, note.duration * ppt);
    const nh = rowHeight - 1;
    if (x >= nx && x <= nx + nw && y >= ny && y <= ny + nh) return note;
  }
  return null;
}

export function PianoRollView({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PianoRollRenderer | null>(null);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; startX: number; startY: number; startTick: number; startPitch: number; startDuration: number } | null>(null);

  const notes = usePianoRollStore((s) => s.notes);
  const selectedNoteIds = usePianoRollStore((s) => s.selectedNoteIds);
  const activeTool = usePianoRollStore((s) => s.activeTool);
  const scrollX = usePianoRollStore((s) => s.scrollX);
  const scrollY = usePianoRollStore((s) => s.scrollY);
  const pixelsPerBar = usePianoRollStore((s) => s.pixelsPerBar);
  const rowHeight = usePianoRollStore((s) => s.rowHeight);
  const activeTrackId = usePianoRollStore((s) => s.activeTrackId);
  const setScroll = usePianoRollStore((s) => s.setScroll);
  const setPixelsPerBar = usePianoRollStore((s) => s.setPixelsPerBar);
  const selectNotes = usePianoRollStore((s) => s.selectNotes);
  const addNote = usePianoRollStore((s) => s.addNote);
  const deleteNote = usePianoRollStore((s) => s.deleteNote);
  const moveNote = usePianoRollStore((s) => s.moveNote);
  const resizeNote = usePianoRollStore((s) => s.resizeNote);

  const tracks = useTrackStore((s) => s.tracks);
  const timeSignature = useSessionStore((s) => s.timeSignature);
  const positionTicks = useSessionStore((s) => s.positionTicks);
  const monteCarlo = useTheoryStore((s) => s.monteCarlo);
  const harmonicHighlights = monteCarlo?.harmonic_highlights ?? null;
  const doctorSuggestions = useDoctorStore((s) => s.suggestions);

  const rollHeight = Math.max(120, height - VELOCITY_LANE_HEIGHT);
  const rollWidth = Math.max(200, width - tokens.spacing.pianoKeyboardWidth);

  const trackColorById = useMemo(
    () => new Map(tracks.map((t) => [t.id, t.color])),
    [tracks],
  );

  const renderNotes: PianoRollRenderNote[] = useMemo(
    () =>
      notes.map((note) => ({
        ...note,
        trackColor: trackColorById.get(note.trackId) ?? "#3A5A7A",
        selected: selectedNoteIds.includes(note.id),
        harmonicConflict: harmonicHighlights
          ? isPitchClassOutOfKey(note.pitch, harmonicHighlights)
          : false,
      })),
    [notes, selectedNoteIds, trackColorById, harmonicHighlights],
  );

  const draw = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.resize(rollWidth, rollHeight);
    renderer.render(
      {
        width: rollWidth,
        height: rollHeight,
        scrollX,
        scrollY,
        pixelsPerBar,
        rowHeight,
        timeSignature,
        playheadTick: positionTicks,
      },
      renderNotes,
      harmonicHighlights,
    );
  }, [renderNotes, rollHeight, rollWidth, scrollX, scrollY, pixelsPerBar, rowHeight, timeSignature, positionTicks, harmonicHighlights]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      rendererRef.current = new PianoRollRenderer(canvas);
    } catch {
      return undefined;
    }
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      setPixelsPerBar(pixelsPerBar * (e.deltaY > 0 ? 0.9 : 1.1));
      return;
    }
    if (e.shiftKey) {
      setScroll(scrollX + e.deltaY, scrollY);
      return;
    }
    setScroll(scrollX + e.deltaX, scrollY + e.deltaY);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitTestNote(renderNotes, x, y, pixelsPerBar, rowHeight, scrollX, scrollY, timeSignature);

    if (activeTool === "pencil" && !hit) {
      const tick = xToTick(x, pixelsPerBar, timeSignature, scrollX);
      const pitch = yToPitch(y, rowHeight, scrollY);
      addNote({
        pitch,
        tick,
        duration: 480,
        velocity: 100,
        trackId: activeTrackId,
      });
      return;
    }

    if (activeTool === "eraser" && hit) {
      deleteNote(hit.id);
      return;
    }

    if (activeTool === "pointer") {
      if (!hit) {
        selectNotes([]);
        return;
      }
      selectNotes([hit.id]);
      const ppt = pixelsPerTick(pixelsPerBar, timeSignature);
      const resizeEdge = x >= tickToX(hit.tick, pixelsPerBar, timeSignature, scrollX) + Math.max(3, hit.duration * ppt) - 8;
      dragRef.current = {
        id: hit.id,
        mode: resizeEdge ? "resize" : "move",
        startX: x,
        startY: y,
        startTick: hit.tick,
        startPitch: hit.pitch,
        startDuration: hit.duration,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    const ppt = pixelsPerTick(pixelsPerBar, timeSignature);

    if (drag.mode === "move") {
      const tick = drag.startTick + Math.round(dx / ppt);
      const pitch = drag.startPitch - Math.round(dy / rowHeight);
      moveNote(drag.id, tick, pitch);
    } else {
      const duration = drag.startDuration + Math.round(dx / ppt);
      resizeNote(drag.id, duration);
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const velocityCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = velocityCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rollWidth * dpr;
    canvas.height = VELOCITY_LANE_HEIGHT * dpr;
    canvas.style.width = `${rollWidth}px`;
    canvas.style.height = `${VELOCITY_LANE_HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = tokens.colors.background.surface;
    ctx.fillRect(0, 0, rollWidth, VELOCITY_LANE_HEIGHT);

    const ppt = pixelsPerTick(pixelsPerBar, timeSignature);
    for (const note of renderNotes) {
      const x = tickToX(note.tick, pixelsPerBar, timeSignature, scrollX);
      const barH = (note.velocity / 127) * (VELOCITY_LANE_HEIGHT - 12);
      ctx.fillStyle = note.trackColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x, VELOCITY_LANE_HEIGHT - barH - 4, Math.max(3, note.duration * ppt), barH);
    }
    ctx.globalAlpha = 1;
  }, [renderNotes, rollWidth, pixelsPerBar, scrollX, timeSignature]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden" style={{ backgroundColor: tokens.colors.background.canvas }}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <PianoKeyboard
            height={rollHeight}
            rowHeight={rowHeight}
            scrollY={scrollY}
            harmonicHighlights={harmonicHighlights}
          />
          <div className="relative min-h-0 flex-1">
            <canvas
              ref={canvasRef}
              className="block h-full w-full"
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            <DoctorGhostOverlay
              onAccept={(id) => {
                const suggestion = doctorSuggestions.find((s) => s.id === id);
                if (suggestion) acceptDoctorSuggestion(suggestion);
              }}
              onReject={rejectDoctorSuggestion}
            />
            {monteCarlo?.melodic_ghosts.map((ghost, index) => {
              const x = tickToX(ghost.tick, pixelsPerBar, timeSignature, scrollX);
              const y = pitchToY(ghost.pitch, rowHeight, scrollY);
              const w = Math.max(3, ghost.duration_ticks * pixelsPerTick(pixelsPerBar, timeSignature));
              return (
                <div
                  key={`ghost-${index}`}
                  className="pointer-events-none absolute rounded-sm"
                  style={{
                    left: x,
                    top: y,
                    width: w,
                    height: rowHeight - 2,
                    backgroundColor: "rgba(90,58,122,0.35)",
                    border: "1px solid rgba(90,58,122,0.6)",
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="flex" style={{ borderTop: `1px solid ${tokens.colors.border.hairline}` }}>
          <div style={{ width: tokens.spacing.pianoKeyboardWidth }} />
          <canvas ref={velocityCanvasRef} height={VELOCITY_LANE_HEIGHT} />
        </div>
      </div>
    </div>
  );
}
