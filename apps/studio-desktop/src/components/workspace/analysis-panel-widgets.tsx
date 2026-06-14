import { useEffect, useRef, type ReactNode } from "react";
import type { AnalysisMotifNote } from "@consequence/stream";
import { tokens } from "@consequence/ui/design-system";

const PITCH_LABELS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const CIRCLE_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-2 mt-3 first:mt-0"
      style={{
        color: tokens.colors.text.primary,
        fontSize: tokens.typography.fontSize.compact,
        fontWeight: tokens.typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </div>
  );
}

export function AnimatedBar({ value, color }: { value: number; color: string }) {
  const pct = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded"
      style={{ backgroundColor: tokens.colors.background.canvas }}
    >
      <div
        style={{
          width: pct,
          height: "100%",
          backgroundColor: color,
          transition: "width 150ms ease",
        }}
      />
    </div>
  );
}

export function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <span style={{ color: tokens.colors.text.muted, fontSize: 11 }}>{label}</span>
      <span
        className="font-mono"
        style={{
          color: tokens.colors.text.secondary,
          fontSize: 11,
          transition: "color 150ms ease",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function CircleOfFifths({ activePitchClasses }: { activePitchClasses: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = new Set(activePitchClasses);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 80;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 28;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = tokens.colors.background.canvas;
    ctx.fillRect(0, 0, size, size);

    CIRCLE_ORDER.forEach((pc, index) => {
      const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const on = active.has(pc);
      ctx.beginPath();
      ctx.arc(x, y, on ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = on ? tokens.colors.accent.cmte : tokens.colors.border.standard;
      ctx.fill();
      ctx.fillStyle = on ? tokens.colors.text.accent : tokens.colors.text.muted;
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(PITCH_LABELS[pc], x, y + 3);
    });
  }, [activePitchClasses]);

  return <canvas ref={canvasRef} width={80} height={80} className="rounded" />;
}

export function GrooveGrid({ cells }: { cells: number[] }) {
  return (
    <div
      className="gap-0.5"
      style={{ display: "grid", gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
    >
      {cells.map((density, index) => (
        <div
          key={`groove-${index}`}
          className="h-4 rounded-sm"
          style={{
            backgroundColor: tokens.colors.accent.cmte,
            opacity: 0.15 + density * 0.85,
            transition: "opacity 150ms ease",
          }}
        />
      ))}
    </div>
  );
}

export function ContourSparkline({ values }: { values: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 72;
    const h = 20;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = tokens.colors.accent.doctor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * (w - 4) + 2;
      const y = h - 2 - value * (h - 4);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [values]);

  return <canvas ref={canvasRef} width={72} height={20} />;
}

export function MotifPreview({ motif }: { motif: AnalysisMotifNote[] | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 120;
    const h = 40;
    ctx.fillStyle = tokens.colors.background.canvas;
    ctx.fillRect(0, 0, w, h);
    if (!motif || motif.length === 0) {
      ctx.fillStyle = tokens.colors.text.muted;
      ctx.font = "10px sans-serif";
      ctx.fillText("No motif", 8, 22);
      return;
    }
    const minPitch = Math.min(...motif.map((n) => n.pitch));
    const maxPitch = Math.max(...motif.map((n) => n.pitch));
    const span = Math.max(1, maxPitch - minPitch);
    const maxTick = Math.max(...motif.map((n) => n.tick + n.duration), 1);
    for (const note of motif) {
      const x = (note.tick / maxTick) * (w - 12) + 4;
      const noteW = Math.max(4, (note.duration / maxTick) * (w - 12));
      const y = 4 + ((maxPitch - note.pitch) / span) * (h - 12);
      const noteH = Math.max(4, (h - 12) / (span + 1));
      ctx.fillStyle = tokens.colors.accent.doctor;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(x, y, noteW, noteH);
    }
    ctx.globalAlpha = 1;
  }, [motif]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={40}
      className="rounded"
      style={{ border: `1px solid ${tokens.colors.border.hairline}` }}
    />
  );
}

export function ModulationTimeline({
  entries,
}: {
  entries: Array<{ tick: number; key: string; mode: string }>;
}) {
  if (entries.length === 0) {
    return <div style={{ color: tokens.colors.text.muted, fontSize: 11 }}>No modulations yet</div>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((entry, index) => (
        <span
          key={`${entry.tick}-${entry.key}-${index}`}
          className="rounded px-1.5 py-0.5 font-mono"
          style={{
            backgroundColor: tokens.colors.background.elevated,
            color: tokens.colors.text.secondary,
            fontSize: 10,
            transition: "opacity 150ms ease",
          }}
        >
          {entry.key} {entry.mode} @{entry.tick}
        </span>
      ))}
    </div>
  );
}
