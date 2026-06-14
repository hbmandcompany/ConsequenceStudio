import { useEffect, useRef } from "react";
import { tokens } from "@consequence/ui/design-system";

export function MarketSparkline({ values }: { values: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 200;
    const h = 32;
    ctx.clearRect(0, 0, w, h);
    if (values.length === 0) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(0.001, max - min);

    ctx.strokeStyle = tokens.colors.track.teal;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * (w - 4) + 2;
      const y = h - 2 - ((value - min) / span) * (h - 4);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [values]);

  return <canvas ref={canvasRef} width={200} height={32} className="w-full" />;
}

export function formatUsdc(value: number): string {
  const prefix = value < 0 ? "-" : "";
  return `${prefix}$${Math.abs(value).toFixed(2)}`;
}
