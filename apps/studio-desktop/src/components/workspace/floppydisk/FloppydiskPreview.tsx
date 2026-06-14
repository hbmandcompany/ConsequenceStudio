import type { FloppydiskAsset } from "@consequence/stream";
import { tokens } from "@consequence/ui/design-system";

interface FloppydiskPreviewProps {
  asset: FloppydiskAsset;
  width?: number;
  height?: number;
}

function MidiPreview({
  notes,
  width,
  height,
}: {
  notes: NonNullable<FloppydiskAsset["preview_notes"]>;
  width: number;
  height: number;
}) {
  const minPitch = Math.min(...notes.map((n) => n.pitch));
  const maxPitch = Math.max(...notes.map((n) => n.pitch));
  const maxTick = Math.max(...notes.map((n) => n.tick + n.duration), 1);
  const pitchSpan = Math.max(1, maxPitch - minPitch);

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {notes.map((note, index) => {
        const x = (note.tick / maxTick) * (width - 4) + 2;
        const w = Math.max(3, (note.duration / maxTick) * (width - 4));
        const y = ((maxPitch - note.pitch) / pitchSpan) * (height - 8) + 4;
        const h = Math.max(3, height / (pitchSpan + 2));
        return (
          <rect
            key={`${note.pitch}-${note.tick}-${index}`}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={1}
            fill={tokens.colors.track.indigo}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

function WaveformPreview({ samples, width, height }: { samples: number[]; width: number; height: number }) {
  const mid = height / 2;
  const step = width / Math.max(1, samples.length - 1);
  const path = samples
    .map((value, index) => {
      const x = index * step;
      const y = mid - value * (height * 0.4);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={path} fill="none" stroke={tokens.colors.track.teal} strokeWidth={1.5} />
    </svg>
  );
}

export function FloppydiskPreview({ asset, width = 312, height = 44 }: FloppydiskPreviewProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: tokens.borderRadius.sm,
        backgroundColor: tokens.colors.background.canvas,
        border: `1px solid ${tokens.colors.border.hairline}`,
        overflow: "hidden",
      }}
    >
      {asset.asset_type === "midi_fragment" && asset.preview_notes ? (
        <MidiPreview notes={asset.preview_notes} width={width} height={height} />
      ) : asset.asset_type === "sample" && asset.preview_waveform ? (
        <WaveformPreview samples={asset.preview_waveform} width={width} height={height} />
      ) : (
        <div
          className="flex h-full items-center justify-center"
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.text.muted,
          }}
        >
          {asset.asset_type === "embedding" ? "Vector preview" : "Dataset preview"}
        </div>
      )}
    </div>
  );
}
