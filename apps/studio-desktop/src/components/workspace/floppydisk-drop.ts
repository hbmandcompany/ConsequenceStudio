import { useCallback, type DragEvent } from "react";
import {
  FLOPPYDISK_DRAG_MIME,
  parseAssetDragPayload,
  xToTick,
} from "@consequence/state";
import { injectFloppydiskAssetAt } from "./floppydisk-actions";

interface FloppydiskDropOptions {
  target: "arrangement" | "piano-roll";
  pixelsPerBar: number;
  timeSignature: [number, number];
  scrollX: number;
  xOffset?: number;
  resolveTrackId?: (clientY: number, rectTop: number) => string | undefined;
  resolvePitch?: (clientY: number, rectTop: number) => number | undefined;
}

export function useFloppydiskDropZone({
  target,
  pixelsPerBar,
  timeSignature,
  scrollX,
  xOffset = 0,
  resolveTrackId,
  resolvePitch,
}: FloppydiskDropOptions) {
  const onDragOver = useCallback((event: DragEvent) => {
    if (!event.dataTransfer.types.includes(FLOPPYDISK_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      const raw = event.dataTransfer.getData(FLOPPYDISK_DRAG_MIME);
      const asset = parseAssetDragPayload(raw);
      if (!asset) return;
      event.preventDefault();

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const localX = event.clientX - rect.left - xOffset;
      const tick = xToTick(localX, pixelsPerBar, timeSignature, scrollX);
      const trackId = resolveTrackId?.(event.clientY, rect.top);
      const pitch = resolvePitch?.(event.clientY, rect.top);

      injectFloppydiskAssetAt(asset, target, { tick, trackId, pitch });
    },
    [pixelsPerBar, resolvePitch, resolveTrackId, scrollX, target, timeSignature, xOffset],
  );

  return { onDragOver, onDrop };
}
