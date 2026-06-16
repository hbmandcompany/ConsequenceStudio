import {
  DEFAULT_INSTRUMENT,
  useTrackStore,
  type TrackType,
  useWorkspaceStore,
} from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

const INSTRUMENT_OPTIONS: Record<TrackType, string[]> = {
  midi: ["External MIDI", "Drum Machine", "Sampler", "MIDI FX"],
  audio: ["Audio Input", "Mic Input", "Line Input", "Reamp"],
  instrument: ["Consequence Instrument", "Sampler", "Synth", "Drum Kit"],
};

export function TrackInstrumentModal() {
  const trackId = useWorkspaceStore((s) => s.instrumentEditorTrackId);
  const close = useWorkspaceStore((s) => s.closeInstrumentEditor);
  const track = useTrackStore((s) => s.tracks.find((t) => t.id === trackId));
  const updateTrack = useTrackStore((s) => s.updateTrack);

  if (!trackId || !track) return null;

  const setType = (type: TrackType) => {
    updateTrack(track.id, {
      type,
      instrument: DEFAULT_INSTRUMENT[type],
      midiChannel: type === "audio" ? 0 : track.midiChannel || 1,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={close}
      onKeyDown={(e) => e.key === "Escape" && close()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-labelledby="track-instrument-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 360,
          background: tokens.colors.background.surface,
          border: `1px solid ${tokens.colors.border.standard}`,
          borderRadius: tokens.borderRadius.lg,
          boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
          padding: 16,
        }}
      >
        <div
          id="track-instrument-title"
          style={{
            fontSize: tokens.typography.fontSize.compact,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.text.primary,
            marginBottom: 12,
          }}
        >
          {track.name} — Instrument
        </div>

        <label style={{ display: "block", fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted, marginBottom: 4 }}>
          Track type
        </label>
        <div className="mb-3 flex gap-2">
          {(["midi", "audio", "instrument"] as TrackType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setType(type)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: tokens.borderRadius.sm,
                border: `1px solid ${track.type === type ? tokens.colors.border.active : tokens.colors.border.standard}`,
                background: track.type === type ? tokens.colors.background.elevated : "transparent",
                color: track.type === type ? tokens.colors.text.accent : tokens.colors.text.secondary,
                fontSize: tokens.typography.fontSize.xs,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted, marginBottom: 4 }}>
          Instrument
        </label>
        <select
          value={track.instrument}
          onChange={(e) => updateTrack(track.id, { instrument: e.target.value })}
          style={{
            width: "100%",
            marginBottom: 12,
            padding: "6px 8px",
            borderRadius: tokens.borderRadius.sm,
            border: `1px solid ${tokens.colors.border.standard}`,
            background: tokens.colors.background.canvas,
            color: tokens.colors.text.primary,
            fontSize: tokens.typography.fontSize.compact,
          }}
        >
          {INSTRUMENT_OPTIONS[track.type].map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {track.type !== "audio" && (
          <>
            <label style={{ display: "block", fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted, marginBottom: 4 }}>
              MIDI channel
            </label>
            <select
              value={track.midiChannel}
              onChange={(e) => updateTrack(track.id, { midiChannel: Number(e.target.value) })}
              style={{
                width: "100%",
                marginBottom: 12,
                padding: "6px 8px",
                borderRadius: tokens.borderRadius.sm,
                border: `1px solid ${tokens.colors.border.standard}`,
                background: tokens.colors.background.canvas,
                color: tokens.colors.text.primary,
                fontSize: tokens.typography.fontSize.compact,
              }}
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((ch) => (
                <option key={ch} value={ch}>
                  Channel {ch}
                </option>
              ))}
            </select>
          </>
        )}

        <div style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted, marginBottom: 12 }}>
          Output · Main
        </div>

        <button
          type="button"
          onClick={close}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: tokens.borderRadius.sm,
            border: "none",
            background: tokens.colors.text.accent,
            color: tokens.colors.background.canvas,
            fontSize: tokens.typography.fontSize.compact,
            fontWeight: tokens.typography.fontWeight.semibold,
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
