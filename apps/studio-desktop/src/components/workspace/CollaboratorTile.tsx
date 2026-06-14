import { useEffect, useRef } from "react";
import type { CollaborationPresencePayload } from "@consequence/stream";
import { VideoSessionManager } from "@consequence/stream";
import { tokens } from "@consequence/ui/design-system";

const TILE_WIDTH = 140;
const TILE_HEIGHT = 96;

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ACTIVITY_LABELS: Record<CollaborationPresencePayload["activity"], string> = {
  playing: "Playing",
  editing: "Editing",
  idle: "Idle",
};

interface CollaboratorTileProps {
  participant: CollaborationPresencePayload;
  showVideo?: boolean;
  videoManager?: VideoSessionManager | null;
}

function CollaboratorTile({ participant, showVideo, videoManager }: CollaboratorTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!showVideo || !videoRef.current || !videoManager) return;
    videoManager.attachToVideo(videoRef.current);
  }, [showVideo, videoManager]);

  return (
    <div
      className="rounded"
      style={{
        width: TILE_WIDTH,
        backgroundColor: tokens.colors.background.elevated,
        border: `1px solid ${tokens.colors.border.hairline}`,
      }}
    >
      <div
        className="relative overflow-hidden rounded-t"
        style={{ width: TILE_WIDTH, height: TILE_HEIGHT, backgroundColor: tokens.colors.background.canvas }}
      >
        {showVideo && videoManager?.isCameraEnabled ? (
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-full w-full object-cover"
            style={{ width: TILE_WIDTH, height: TILE_HEIGHT }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div
              className="flex items-center justify-center rounded-full font-mono"
              style={{
                width: 44,
                height: 44,
                backgroundColor: tokens.colors.background.elevated,
                color: tokens.colors.text.secondary,
                fontSize: 14,
              }}
            >
              {initials(participant.name)}
            </div>
          </div>
        )}
        <span
          className="absolute bottom-1 right-1 rounded px-1"
          style={{
            fontSize: 9,
            color: tokens.colors.text.accent,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          {ACTIVITY_LABELS[participant.activity]}
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: participant.cursor_color }}
          title="Cursor color"
        />
        <span style={{ fontSize: 12, color: tokens.colors.text.primary }}>{participant.name}</span>
      </div>
    </div>
  );
}

export { CollaboratorTile, TILE_WIDTH };
