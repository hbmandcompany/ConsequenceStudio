import { useTrackStore } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

const MIXER_HEADER_HEIGHT = 24;
const MIXER_STRIP_MIN_WIDTH = 72;
const FADER_HEIGHT = 100;
const METER_HEIGHT = FADER_HEIGHT;

function MsButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 22,
        height: 18,
        fontSize: 9,
        fontWeight: tokens.typography.fontWeight.semibold,
        border: `1px solid ${active ? tokens.colors.border.active : tokens.colors.border.standard}`,
        borderRadius: tokens.borderRadius.xs,
        background: active ? tokens.colors.background.elevated : tokens.colors.background.canvas,
        color: active ? tokens.colors.text.accent : tokens.colors.text.muted,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ChannelStrip({ trackId }: { trackId: string }) {
  const track = useTrackStore((s) => s.tracks.find((t) => t.id === trackId));
  const updateTrack = useTrackStore((s) => s.updateTrack);
  const toggleMute = useTrackStore((s) => s.toggleMute);
  const toggleSolo = useTrackStore((s) => s.toggleSolo);

  if (!track) return null;

  const meterH = Math.round(METER_HEIGHT * Math.max(track.peakLevel, track.rmsLevel, 0.04));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: MIXER_STRIP_MIN_WIDTH,
        flex: "1 1 0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.text.secondary,
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={track.name}
      >
        {track.name}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <MsButton label="M" active={track.muted} onClick={() => toggleMute(track.id)} />
        <MsButton label="S" active={track.solo} onClick={() => toggleSolo(track.id)} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: FADER_HEIGHT }}>
        <div
          style={{
            width: 10,
            height: METER_HEIGHT,
            borderRadius: 2,
            background: tokens.colors.background.canvas,
            border: `1px solid ${tokens.colors.border.hairline}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: meterH,
              background: `linear-gradient(to top, ${track.color}, ${tokens.colors.accent.platform})`,
              opacity: 0.85,
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(track.volume * 100)}
          onChange={(e) => updateTrack(track.id, { volume: Number(e.target.value) / 100 })}
          aria-label={`${track.name} volume`}
          style={{
            writingMode: "vertical-lr",
            direction: "rtl",
            width: 28,
            height: FADER_HEIGHT,
            accentColor: track.color,
            cursor: "pointer",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", paddingBottom: 2 }}>
        <span style={{ fontSize: 9, color: tokens.colors.text.muted, width: 22 }}>Pan</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((track.pan + 1) * 50)}
          onChange={(e) => updateTrack(track.id, { pan: Number(e.target.value) / 50 - 1 })}
          aria-label={`${track.name} pan`}
          style={{ flex: 1, accentColor: track.color, cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

/** Logic-style mixer anchored at the bottom of the left panel — does not scroll with tracks. */
export function MixerPanel() {
  const tracks = useTrackStore((s) => s.tracks);
  const selectedTrackIds = useTrackStore((s) => s.selectedTrackIds);

  const visibleIds =
    selectedTrackIds.length > 0
      ? tracks.filter((t) => selectedTrackIds.includes(t.id)).map((t) => t.id)
      : tracks.map((t) => t.id);

  return (
    <div
      style={{
        flexShrink: 0,
        minHeight: 220,
        borderTop: `1px solid ${tokens.colors.border.standard}`,
        background: tokens.colors.background.elevated,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center justify-between px-3"
        style={{
          height: MIXER_HEADER_HEIGHT,
          borderBottom: `1px solid ${tokens.colors.border.hairline}`,
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.text.muted,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.text.secondary }}>
          Mixer
        </span>
        <span>Output · Main</span>
      </div>
      <div
        className="flex flex-1 gap-2 px-2 py-2"
        style={{ alignItems: "stretch", overflow: "hidden" }}
      >
        {visibleIds.length === 0 ? (
          <div
            className="flex flex-1 items-center justify-center"
            style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted }}
          >
            Add a track to mix
          </div>
        ) : (
          visibleIds.map((id) => <ChannelStrip key={id} trackId={id} />)
        )}
      </div>
    </div>
  );
}
