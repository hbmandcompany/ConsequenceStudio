import { useTrackStore } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

function KnobControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: `2px solid ${tokens.colors.border.standard}`,
          background: `conic-gradient(${tokens.colors.text.muted} ${value * 360}deg, ${tokens.colors.background.canvas} 0)`,
        }}
        onClick={() => onChange(Math.min(1, value + 0.1))}
        role="slider"
        aria-label={label}
      />
      <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted }}>{label}</span>
      <span style={{ fontFamily: tokens.typography.fontFamily.mono, fontSize: tokens.typography.fontSize.xs }}>
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

export function InspectorPanel() {
  const tracks = useTrackStore((s) => s.tracks);
  const selectedTrackIds = useTrackStore((s) => s.selectedTrackIds);
  const updateTrack = useTrackStore((s) => s.updateTrack);
  const track = tracks.find((t) => t.id === selectedTrackIds[0]);

  if (!track) {
    return (
      <div
        className="flex flex-1 items-center justify-center p-4"
        style={{ color: tokens.colors.text.muted, fontSize: tokens.typography.fontSize.compact }}
      >
        Select a track
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
      style={{ backgroundColor: tokens.colors.background.surface }}
    >
      <div>
        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.muted, marginBottom: 4 }}>
          Instrument
        </div>
        <div style={{ fontSize: tokens.typography.fontSize.compact, color: tokens.colors.text.primary }}>
          {track.type === "instrument" ? "Consequence Instrument" : track.type.toUpperCase()}
        </div>
      </div>

      <div>
        <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.muted, marginBottom: 4 }}>
          Effects
        </div>
        {["EQ", "Compressor", "Reverb"].map((fx, i) => (
          <div
            key={fx}
            className="mb-1 flex items-center justify-between rounded px-2 py-1"
            style={{
              backgroundColor: tokens.colors.background.elevated,
              fontSize: tokens.typography.fontSize.compact,
              color: tokens.colors.text.secondary,
            }}
          >
            <span>{fx}</span>
            <input type="checkbox" defaultChecked={i === 0} readOnly />
          </div>
        ))}
      </div>

      <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.muted }}>
        MIDI Ch {track.midiChannel}
      </div>
      <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.muted }}>
        Output · Main
      </div>

      <div className="flex gap-4">
        <KnobControl
          label="Vol"
          value={track.volume}
          onChange={(v) => updateTrack(track.id, { volume: v })}
        />
        <KnobControl
          label="Pan"
          value={(track.pan + 1) / 2}
          onChange={(v) => updateTrack(track.id, { pan: v * 2 - 1 })}
        />
      </div>
    </div>
  );
}
