import { useCallback, useEffect, useRef } from "react";
import { pixelsPerTick, tickToX, ticksPerBar } from "@consequence/audio";
import { usePianoRollStore, useSessionStore, useTrackStore } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function pitchName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/** Staff-style horizontal score view — same notes as the piano roll, read left-to-right. */
export function ScoreView({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notes = usePianoRollStore((s) => s.notes);
  const activeTrackId = usePianoRollStore((s) => s.activeTrackId);
  const scrollX = usePianoRollStore((s) => s.scrollX);
  const pixelsPerBar = usePianoRollStore((s) => s.pixelsPerBar);
  const rowHeight = usePianoRollStore((s) => s.rowHeight);
  const scrollY = usePianoRollStore((s) => s.scrollY);
  const timeSignature = useSessionStore((s) => s.timeSignature);
  const positionTicks = useSessionStore((s) => s.positionTicks);
  const tracks = useTrackStore((s) => s.tracks);

  const trackColorById = new Map(tracks.map((t) => [t.id, t.color]));
  const visibleNotes = activeTrackId
    ? notes.filter((n) => n.trackId === activeTrackId)
    : notes;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = tokens.colors.background.canvas;
    ctx.fillRect(0, 0, width, height);

    const staffTop = 48;
    const staffHeight = height - staffTop - 24;
    const lineGap = staffHeight / 8;

    ctx.strokeStyle = tokens.colors.border.hairline;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const y = staffTop + i * lineGap * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const ppt = pixelsPerTick(pixelsPerBar, timeSignature);
    const tpb = ticksPerBar(timeSignature);
    ctx.fillStyle = tokens.colors.text.muted;
    ctx.font = `10px ${tokens.typography.fontFamily.mono}`;
    for (let bar = 0; bar * tpb < scrollX + width / ppt + tpb; bar += 1) {
      const tick = bar * tpb;
      const x = tick * ppt - scrollX;
      if (x < -40 || x > width + 40) continue;
      ctx.fillStyle = tokens.colors.border.hairline;
      ctx.fillRect(x, 0, 1, height);
      ctx.fillStyle = tokens.colors.text.muted;
      ctx.fillText(String(bar + 1), x + 4, 14);
    }

    const playheadX = positionTicks * ppt - scrollX;
    ctx.strokeStyle = tokens.colors.accent.platform;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    for (const note of visibleNotes) {
      const x = tickToX(note.tick, pixelsPerBar, timeSignature, scrollX);
      const noteW = Math.max(4, note.duration * ppt);
      const noteH = Math.max(6, rowHeight - 1);
      const staffY = staffTop + ((127 - note.pitch) / 127) * (staffHeight - noteH);

      const color = trackColorById.get(note.trackId) ?? "#3A5A7A";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35 + (note.velocity / 127) * 0.55;
      ctx.beginPath();
      ctx.ellipse(x + noteW / 2, staffY + noteH / 2, noteW / 2, noteH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (noteW > 28) {
        ctx.fillStyle = tokens.colors.text.secondary;
        ctx.font = `9px ${tokens.typography.fontFamily.mono}`;
        ctx.fillText(pitchName(note.pitch), x + 4, staffY + noteH - 2);
      }
    }

    ctx.fillStyle = tokens.colors.text.muted;
    ctx.font = `10px ${tokens.typography.fontFamily.ui}`;
    ctx.fillText(
      activeTrackId
        ? `Score · ${tracks.find((t) => t.id === activeTrackId)?.name ?? "Track"}`
        : "Score · all tracks",
      8,
      height - 8,
    );
  }, [
    activeTrackId,
    height,
    pixelsPerBar,
    positionTicks,
    rowHeight,
    scrollX,
    scrollY,
    timeSignature,
    trackColorById,
    tracks,
    visibleNotes,
    width,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const setScroll = usePianoRollStore.getState().setScroll;
    const setPixelsPerBar = usePianoRollStore.getState().setPixelsPerBar;
    const { scrollX: sx, scrollY: sy, pixelsPerBar: ppb } = usePianoRollStore.getState();
    if (e.ctrlKey) {
      setPixelsPerBar(ppb * (e.deltaY > 0 ? 0.9 : 1.1));
      return;
    }
    setScroll(sx + e.deltaX + e.deltaY, sy);
  };

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full"
      onWheel={onWheel}
      style={{ background: tokens.colors.background.canvas, cursor: "default" }}
    />
  );
}
