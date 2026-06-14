import { useEffect, useRef } from "react";
import { pitchToY } from "@consequence/audio";
import type { HarmonicHighlights } from "@consequence/stream";
import { harmonicRowRole } from "@consequence/stream";
import { tokens } from "@consequence/ui/design-system";

const KEYBOARD_WIDTH = tokens.spacing.pianoKeyboardWidth;
const BLACK_PITCHES = new Set([1, 3, 6, 8, 10]);

function isBlackKey(pitch: number): boolean {
  return BLACK_PITCHES.has(pitch % 12);
}

interface PianoKeyboardProps {
  height: number;
  rowHeight: number;
  scrollY: number;
  harmonicHighlights?: HarmonicHighlights | null;
  onKeyClick?: (pitch: number) => void;
}

export function PianoKeyboard({ height, rowHeight, scrollY, harmonicHighlights, onKeyClick }: PianoKeyboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = KEYBOARD_WIDTH * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${KEYBOARD_WIDTH}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = tokens.colors.background.surface;
    ctx.fillRect(0, 0, KEYBOARD_WIDTH, height);

    const firstPitch = Math.max(0, Math.floor(scrollY / rowHeight));
    const lastPitch = Math.min(127, firstPitch + Math.ceil(height / rowHeight) + 1);

    for (let pitch = firstPitch; pitch <= lastPitch; pitch += 1) {
      const y = pitchToY(pitch, rowHeight, scrollY);
      const h = rowHeight;
      const black = isBlackKey(pitch);

      if (harmonicHighlights) {
        const role = harmonicRowRole(pitch % 12, harmonicHighlights);
        if (role === "tonic") {
          ctx.fillStyle = "rgba(58,74,122,0.08)";
          ctx.fillRect(0, y, KEYBOARD_WIDTH, h);
        } else if (role === "dominant") {
          ctx.fillStyle = "rgba(122,106,58,0.05)";
          ctx.fillRect(0, y, KEYBOARD_WIDTH, h);
        }
      }

      ctx.fillStyle = black ? "#0A0A0A" : tokens.colors.pianoRoll.naturalRow;
      ctx.fillRect(0, y, black ? KEYBOARD_WIDTH * 0.62 : KEYBOARD_WIDTH, h);
      if (pitch % 12 === 0) {
        ctx.fillStyle = tokens.colors.text.muted;
        ctx.font = `10px ${tokens.typography.fontFamily.mono}`;
        ctx.fillText(`C${Math.floor(pitch / 12) - 1}`, 4, y + h - 3);
      }
    }
  }, [height, rowHeight, scrollY, harmonicHighlights]);

  return (
    <canvas
      ref={canvasRef}
      width={KEYBOARD_WIDTH}
      height={height}
      style={{
        width: KEYBOARD_WIDTH,
        height,
        cursor: "pointer",
        borderRight: `1px solid ${tokens.colors.border.hairline}`,
        backgroundColor: tokens.colors.background.surface,
      }}
      onMouseDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const pitch = 127 - Math.floor((y + scrollY) / rowHeight);
        if (pitch >= 0 && pitch <= 127) onKeyClick?.(pitch);
      }}
    />
  );
}
