import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
import { tokens } from "../design-system/tokens.js";

interface ResizeHandleProps {
  orientation: "vertical" | "horizontal";
  onResizeDelta: (totalDelta: number) => void;
}

export function ResizeHandle({ orientation, onResizeDelta }: ResizeHandleProps) {
  const startRef = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startRef.current = orientation === "vertical" ? e.clientX : e.clientY;

      const onMove = (ev: MouseEvent) => {
        const current = orientation === "vertical" ? ev.clientX : ev.clientY;
        onResizeDelta(current - startRef.current);
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [orientation, onResizeDelta],
  );

  return (
    <div
      role="separator"
      onMouseDown={onMouseDown}
      style={{
        flexShrink: 0,
        width: orientation === "vertical" ? 4 : "100%",
        height: orientation === "horizontal" ? 4 : "100%",
        cursor: orientation === "vertical" ? "col-resize" : "row-resize",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = tokens.colors.border.hairline;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
      }}
    />
  );
}

interface ResizablePanelProps {
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
  edge?: "left" | "right";
  children: ReactNode;
}

export function ResizablePanel({
  width,
  minWidth = 200,
  maxWidth = 480,
  onWidthChange,
  edge = "right",
  children,
}: ResizablePanelProps) {
  const startWidthRef = useRef(width ?? 260);

  const handleResizeDelta = useCallback(
    (delta: number) => {
      if (!onWidthChange) return;
      const signed = edge === "right" ? -delta : delta;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + signed));
      onWidthChange(next);
    },
    [onWidthChange, edge, minWidth, maxWidth],
  );

  const onMouseDownCapture = useCallback(() => {
    startWidthRef.current = width ?? startWidthRef.current;
  }, [width]);

  return (
    <div
      className="flex shrink-0"
      onMouseDownCapture={onMouseDownCapture}
      style={{
        width: width ?? "auto",
        height: "100%",
        flexDirection: edge === "right" ? "row" : "row-reverse",
      }}
    >
      {onWidthChange && (
        <ResizeHandle orientation="vertical" onResizeDelta={handleResizeDelta} />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
