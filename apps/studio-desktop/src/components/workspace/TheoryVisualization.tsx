import { useEffect, useRef } from "react";
import type { MonteCarloOutput } from "@consequence/stream";
import { tokens } from "@consequence/ui/design-system";

interface TheoryVisualizationProps {
  monteCarlo: MonteCarloOutput | null;
  width: number;
  height: number;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function TheoryVisualization({ monteCarlo, width, height }: TheoryVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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

    if (!monteCarlo) {
      ctx.fillStyle = tokens.colors.text.muted;
      ctx.font = `${tokens.typography.fontSize.sm}px ${tokens.typography.fontFamily.mono}`;
      ctx.fillText("CMTE — awaiting theory engine frames…", 16, 28);
      return;
    }

    const pad = 16;
    const chartW = width * 0.28;
    const pathArea = {
      x: pad,
      y: pad,
      w: width - chartW - pad * 3,
      h: height * 0.58,
    };
    const ghostArea = {
      x: pad,
      y: pathArea.y + pathArea.h + 12,
      w: width - pad * 2,
      h: height - pathArea.y - pathArea.h - 28,
    };

    ctx.strokeStyle = tokens.colors.border.hairline;
    ctx.strokeRect(pathArea.x, pathArea.y, pathArea.w, pathArea.h);
    ctx.fillStyle = tokens.colors.text.secondary;
    ctx.font = `600 ${tokens.typography.fontSize.compact}px ${tokens.typography.fontFamily.ui}`;
    ctx.fillText(`Chord paths · ${monteCarlo.current_chord ?? "—"}`, pathArea.x + 8, pathArea.y + 14);

    for (const path of monteCarlo.chord_paths) {
      const alpha = 0.25 + path.probability * 4;
      ctx.strokeStyle = `rgba(58, 74, 122, ${Math.min(alpha, 0.9)})`;
      ctx.lineWidth = 1 + path.probability * 8;
      ctx.beginPath();
      for (const node of path.nodes) {
        const px = pathArea.x + 24 + node.x * (pathArea.w - 48);
        const py = pathArea.y + 28 + node.y * (pathArea.h - 44);
        if (node.index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        ctx.fillStyle = tokens.colors.accent.cmte;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tokens.colors.text.primary;
        ctx.font = `${tokens.typography.fontSize.compact}px ${tokens.typography.fontFamily.mono}`;
        ctx.fillText(node.chord, px - 10, py - 10);
      }
      ctx.stroke();
    }

    for (const arrow of monteCarlo.gravity_arrows) {
      const fx = pathArea.x + 24 + arrow.from_x * (pathArea.w - 48);
      const fy = pathArea.y + 28 + arrow.from_y * (pathArea.h - 44);
      const tx = pathArea.x + 24 + arrow.to_x * (pathArea.w - 48);
      const ty = pathArea.y + 28 + arrow.to_y * (pathArea.h - 44);
      ctx.strokeStyle = `rgba(122, 106, 58, ${0.3 + arrow.strength * 3})`;
      ctx.lineWidth = 1 + arrow.strength * 6;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      const angle = Math.atan2(ty - fy, tx - fx);
      const head = 8;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - head * Math.cos(angle - 0.4), ty - head * Math.sin(angle - 0.4));
      ctx.lineTo(tx - head * Math.cos(angle + 0.4), ty - head * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = tokens.colors.accent.tension;
      ctx.fill();
    }

    const chartX = width - chartW - pad;
    const chartY = pad;
    const chartH = height - pad * 2;
    ctx.strokeStyle = tokens.colors.border.hairline;
    ctx.strokeRect(chartX, chartY, chartW, chartH);
    ctx.fillStyle = tokens.colors.text.secondary;
    ctx.fillText("Possibility", chartX + 8, chartY + 14);

    const maxProb = Math.max(...monteCarlo.possibility_chart.map((b) => b.probability), 0.01);
    const barH = (chartH - 40) / Math.max(monteCarlo.possibility_chart.length, 1);
    monteCarlo.possibility_chart.forEach((bar, index) => {
      const y = chartY + 24 + index * barH;
      const bw = (bar.probability / maxProb) * (chartW - 20);
      ctx.fillStyle = tokens.colors.accent.cmte;
      drawRoundedRect(ctx, chartX + 8, y, bw, barH - 6, 2);
      ctx.fill();
      ctx.fillStyle = tokens.colors.text.muted;
      ctx.font = `${tokens.typography.fontSize.compact}px ${tokens.typography.fontFamily.mono}`;
      const label = bar.label.length > 18 ? `${bar.label.slice(0, 16)}…` : bar.label;
      ctx.fillText(label, chartX + 8, y + barH - 8);
    });

    ctx.fillStyle = tokens.colors.text.secondary;
    ctx.fillText("Melodic ghosts", ghostArea.x, ghostArea.y + 10);
    const laneH = Math.max(10, (ghostArea.h - 16) / 12);
    for (const ghost of monteCarlo.melodic_ghosts) {
      const lane = 11 - ((ghost.pitch % 12) / 12) * 11;
      const gx = ghostArea.x + (ghost.tick / 1920) * ghostArea.w;
      const gy = ghostArea.y + 16 + lane * laneH;
      const gw = Math.max(12, (ghost.duration_ticks / 1920) * ghostArea.w);
      ctx.fillStyle = `rgba(90, 58, 122, ${0.2 + ghost.confidence * 0.6})`;
      drawRoundedRect(ctx, gx, gy, gw, laneH - 2, 2);
      ctx.fill();
      ctx.strokeStyle = tokens.colors.accent.doctor;
      ctx.strokeRect(gx, gy, gw, laneH - 2);
    }
  }, [monteCarlo, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ backgroundColor: tokens.colors.background.canvas }}
    />
  );
}
