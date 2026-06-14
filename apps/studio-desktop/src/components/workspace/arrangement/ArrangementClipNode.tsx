import { Group, Rect, Text } from "react-konva";
import type { ArrangementClip } from "@consequence/state";
import { hexToRgba, tickToBar, ticksPerBar, xToTick } from "@consequence/state";

const CLIP_RADIUS = 4;
const NOTE_PITCH_MIN = 36;
const NOTE_PITCH_MAX = 84;
const RESIZE_HANDLE_WIDTH = 6;

interface ArrangementClipNodeProps {
  clip: ArrangementClip;
  trackColor: string;
  y: number;
  laneHeight: number;
  pixelsPerBar: number;
  timeSignature: [number, number];
  scrollX: number;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  onDragEnd: (startTick: number, duplicated: boolean) => void;
  onResizeEnd: (durationTicks: number) => void;
}

export function ArrangementClipNode({
  clip,
  trackColor,
  y,
  laneHeight,
  pixelsPerBar,
  timeSignature,
  scrollX,
  selected,
  onSelect,
  onDragEnd,
  onResizeEnd,
}: ArrangementClipNodeProps) {
  const tpb = ticksPerBar(timeSignature);
  const x = tickToBar(clip.startTick, timeSignature) * pixelsPerBar - scrollX;
  const width = (clip.durationTicks / tpb) * pixelsPerBar;
  const height = laneHeight - 8;

  return (
    <Group
      x={x}
      y={y + 4}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect((e.evt as MouseEvent).shiftKey);
      }}
      onDragEnd={(e) => {
        const node = e.target;
        const nextTick = xToTick(node.x() + scrollX, pixelsPerBar, timeSignature, scrollX);
        const duplicated = e.evt.altKey;
        node.position({
          x: tickToBar(clip.startTick, timeSignature) * pixelsPerBar - scrollX,
          y: 0,
        });
        onDragEnd(nextTick, duplicated);
      }}
    >
      <Rect
        width={width}
        height={height}
        cornerRadius={CLIP_RADIUS}
        fill={hexToRgba(trackColor, 0.2)}
        stroke={hexToRgba(trackColor, 0.8)}
        strokeWidth={selected ? 2 : 1}
        shadowBlur={selected ? 6 : 0}
        shadowColor={trackColor}
      />
      <Text
        x={8}
        y={6}
        text={clip.name}
        fontSize={11}
        fontStyle="500"
        fontFamily="Inter, system-ui, sans-serif"
        fill="rgba(255,255,255,0.8)"
        width={width - 16}
        ellipsis
        listening={false}
      />
      {clip.notes.map((note, index) => {
        const noteX = (note.tick / tpb) * pixelsPerBar;
        const noteW = Math.max(2, (note.duration / tpb) * pixelsPerBar);
        const pitchNorm = (note.pitch - NOTE_PITCH_MIN) / (NOTE_PITCH_MAX - NOTE_PITCH_MIN);
        const noteY = 18 + (1 - pitchNorm) * (height - 22);
        return (
          <Rect
            key={`${clip.id}-note-${index}`}
            x={noteX}
            y={noteY}
            width={noteW}
            height={2}
            fill="rgba(255,255,255,0.6)"
            listening={false}
          />
        );
      })}
      <Rect
        x={width - RESIZE_HANDLE_WIDTH}
        y={0}
        width={RESIZE_HANDLE_WIDTH}
        height={height}
        fill="rgba(255,255,255,0.15)"
        draggable
        dragBoundFunc={(pos) => ({ x: Math.max(24 - RESIZE_HANDLE_WIDTH, pos.x), y: 0 })}
        onDragEnd={(e) => {
          const handleX = e.target.x();
          e.target.x(width - RESIZE_HANDLE_WIDTH);
          onResizeEnd(Math.round(((handleX + RESIZE_HANDLE_WIDTH) / pixelsPerBar) * tpb));
        }}
      />
    </Group>
  );
}
