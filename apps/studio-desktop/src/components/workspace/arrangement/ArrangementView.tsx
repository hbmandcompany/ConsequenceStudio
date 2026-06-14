import { useCallback, useMemo, useRef, useState } from "react";
import { Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  useArrangementStore,
  useSessionStore,
  useTrackStore,
  tickToBar,
  tickToX,
  ticksPerBar,
  xToTick,
} from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";
import { ArrangementClipNode } from "./ArrangementClipNode";

const RULER_HEIGHT = 24;
const TRACK_ROW_HEIGHT = tokens.spacing.trackRowHeight;

interface ArrangementViewProps {
  width: number;
  height: number;
}

export function ArrangementView({ width, height }: ArrangementViewProps) {
  const tracks = useTrackStore((s) => s.tracks);
  const timeSignature = useSessionStore((s) => s.timeSignature);
  const positionTicks = useSessionStore((s) => s.positionTicks);
  const setPositionTicks = useSessionStore((s) => s.setPositionTicks);

  const clips = useArrangementStore((s) => s.clips);
  const selectedClipIds = useArrangementStore((s) => s.selectedClipIds);
  const scrollX = useArrangementStore((s) => s.scrollX);
  const pixelsPerBar = useArrangementStore((s) => s.pixelsPerBar);
  const setScrollX = useArrangementStore((s) => s.setScrollX);
  const setPixelsPerBar = useArrangementStore((s) => s.setPixelsPerBar);
  const selectClips = useArrangementStore((s) => s.selectClips);
  const clearSelection = useArrangementStore((s) => s.clearSelection);
  const moveClip = useArrangementStore((s) => s.moveClip);
  const resizeClip = useArrangementStore((s) => s.resizeClip);
  const duplicateClip = useArrangementStore((s) => s.duplicateClip);

  const [rubberBand, setRubberBand] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const rubberOrigin = useRef<{ x: number; y: number } | null>(null);

  const canvasHeight = Math.max(height - RULER_HEIGHT, tracks.length * TRACK_ROW_HEIGHT);
  const tpb = ticksPerBar(timeSignature);
  const visibleBars = Math.ceil((width + scrollX) / pixelsPerBar) + 2;

  const rulerMarks = useMemo(() => {
    const marks: Array<{ x: number; label: string; major: boolean }> = [];
    const startBar = Math.floor(scrollX / pixelsPerBar);
    for (let bar = startBar; bar < startBar + visibleBars; bar += 1) {
      const x = bar * pixelsPerBar - scrollX;
      marks.push({ x, label: String(bar + 1), major: true });
      for (let beat = 1; beat < timeSignature[0]; beat += 1) {
        marks.push({
          x: x + (beat / timeSignature[0]) * pixelsPerBar,
          label: "",
          major: false,
        });
      }
    }
    return marks;
  }, [scrollX, pixelsPerBar, visibleBars, timeSignature]);

  const playheadX = tickToX(positionTicks, pixelsPerBar, timeSignature, scrollX);

  const onWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      if (e.evt.ctrlKey) {
        const factor = e.evt.deltaY > 0 ? 0.9 : 1.1;
        setPixelsPerBar(pixelsPerBar * factor, width);
        return;
      }
      const delta = e.evt.shiftKey ? e.evt.deltaY : e.evt.deltaX || e.evt.deltaY;
      setScrollX(scrollX + delta);
    },
    [pixelsPerBar, scrollX, setPixelsPerBar, setScrollX, width],
  );

  const seekFromRuler = (x: number) => {
    setPositionTicks(xToTick(x, pixelsPerBar, timeSignature, scrollX));
  };

  const trackIndexById = useMemo(
    () => new Map(tracks.map((t, index) => [t.id, index])),
    [tracks],
  );

  const finishRubberBand = (box: { x: number; y: number; w: number; h: number }) => {
    const selected = clips
      .filter((clip) => {
        const trackIndex = trackIndexById.get(clip.trackId);
        if (trackIndex === undefined) return false;
        const clipX = tickToBar(clip.startTick, timeSignature) * pixelsPerBar - scrollX;
        const clipW = (clip.durationTicks / tpb) * pixelsPerBar;
        const clipY = trackIndex * TRACK_ROW_HEIGHT + 4;
        const clipH = TRACK_ROW_HEIGHT - 8;
        return (
          clipX < box.x + box.w &&
          clipX + clipW > box.x &&
          clipY < box.y + box.h &&
          clipY + clipH > box.y
        );
      })
      .map((c) => c.id);
    selectClips(selected);
  };

  return (
    <Stage
      width={width}
      height={height}
      onWheel={onWheel}
      style={{ backgroundColor: tokens.colors.background.canvas }}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={width}
          height={RULER_HEIGHT}
          fill={tokens.colors.background.surface}
          onClick={(e) => seekFromRuler(e.evt.offsetX)}
        />
        {rulerMarks.map((mark, i) => (
          <Line
            key={`mark-${i}`}
            points={[mark.x, mark.major ? 8 : 14, mark.x, RULER_HEIGHT]}
            stroke={mark.major ? tokens.colors.border.standard : tokens.colors.border.hairline}
            strokeWidth={1}
            listening={false}
          />
        ))}
        {rulerMarks
          .filter((m) => m.major)
          .map((mark, i) => (
            <Text
              key={`label-${i}`}
              x={mark.x + 4}
              y={4}
              text={mark.label}
              fontSize={10}
              fontFamily={tokens.typography.fontFamily.mono}
              fill={tokens.colors.text.muted}
              listening={false}
            />
          ))}
        <Line
          points={[playheadX, 0, playheadX, RULER_HEIGHT]}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={1}
          listening={false}
        />
        <Line
          points={[playheadX - 5, 0, playheadX + 5, 0, playheadX, 8]}
          closed
          fill="rgba(255,255,255,0.9)"
          listening={false}
        />
      </Layer>

      <Layer y={RULER_HEIGHT} clip={{ x: 0, y: 0, width, height: height - RULER_HEIGHT }}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={canvasHeight}
          fill={tokens.colors.background.canvas}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget) return;
            clearSelection();
            rubberOrigin.current = { x: e.evt.offsetX, y: e.evt.offsetY - RULER_HEIGHT };
            setRubberBand({ x: rubberOrigin.current.x, y: rubberOrigin.current.y, w: 0, h: 0 });
          }}
          onMouseMove={(e) => {
            if (!rubberOrigin.current) return;
            const x = e.evt.offsetX;
            const y = e.evt.offsetY - RULER_HEIGHT;
            const origin = rubberOrigin.current;
            setRubberBand({
              x: Math.min(origin.x, x),
              y: Math.min(origin.y, y),
              w: Math.abs(x - origin.x),
              h: Math.abs(y - origin.y),
            });
          }}
          onMouseUp={() => {
            if (rubberBand && rubberBand.w > 4 && rubberBand.h > 4) {
              finishRubberBand(rubberBand);
            }
            rubberOrigin.current = null;
            setRubberBand(null);
          }}
        />

        {tracks.map((track, index) => {
          const laneY = index * TRACK_ROW_HEIGHT;
          return (
            <Rect
              key={track.id}
              x={0}
              y={laneY}
              width={width + scrollX}
              height={TRACK_ROW_HEIGHT}
              fill={index % 2 === 0 ? tokens.colors.background.canvas : tokens.colors.background.surface}
              opacity={0.35}
              listening={false}
            />
          );
        })}

        {Array.from({ length: visibleBars }).map((_, i) => {
          const bar = Math.floor(scrollX / pixelsPerBar) + i;
          const x = bar * pixelsPerBar - scrollX;
          return (
            <Line
              key={`grid-${bar}`}
              points={[x, 0, x, canvasHeight]}
              stroke={tokens.colors.border.hairline}
              strokeWidth={1}
              listening={false}
            />
          );
        })}

        {clips.map((clip) => {
          const trackIndex = trackIndexById.get(clip.trackId);
          const track = tracks.find((t) => t.id === clip.trackId);
          if (trackIndex === undefined || !track) return null;
          return (
            <ArrangementClipNode
              key={clip.id}
              clip={clip}
              trackColor={track.color}
              y={trackIndex * TRACK_ROW_HEIGHT}
              laneHeight={TRACK_ROW_HEIGHT}
              pixelsPerBar={pixelsPerBar}
              timeSignature={timeSignature}
              scrollX={scrollX}
              selected={selectedClipIds.includes(clip.id)}
              onSelect={(additive) => selectClips([clip.id], additive)}
              onDragEnd={(startTick, duplicated) => {
                if (duplicated) duplicateClip(clip.id, startTick);
                else moveClip(clip.id, startTick);
              }}
              onResizeEnd={(durationTicks) => resizeClip(clip.id, durationTicks)}
            />
          );
        })}

        {rubberBand && (
          <Rect
            x={rubberBand.x}
            y={rubberBand.y}
            width={rubberBand.w}
            height={rubberBand.h}
            stroke={tokens.colors.text.accent}
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        )}

        <Line
          points={[playheadX, 0, playheadX, canvasHeight]}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={1}
          listening={false}
        />
      </Layer>
    </Stage>
  );
}
