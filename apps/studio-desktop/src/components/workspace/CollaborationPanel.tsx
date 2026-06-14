import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { VideoSessionManager } from "@consequence/stream";
import {
  recentChatMessages,
  useAuthStore,
  useCollaborationStore,
} from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";
import { SectionHeader } from "./analysis-panel-widgets";
import { CollaboratorTile } from "./CollaboratorTile";
import { sendCollaborationChat } from "./collaboration-actions";

const videoManager = new VideoSessionManager();

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function CollaborationPanel() {
  const participants = useCollaborationStore((s) => s.participants);
  const messages = useCollaborationStore((s) => s.messages);
  const chatExpanded = useCollaborationStore((s) => s.chatExpanded);
  const cameraEnabled = useCollaborationStore((s) => s.cameraEnabled);
  const micEnabled = useCollaborationStore((s) => s.micEnabled);
  const localDisplayName = useCollaborationStore((s) => s.localDisplayName);
  const setChatExpanded = useCollaborationStore((s) => s.setChatExpanded);
  const setMediaState = useCollaborationStore((s) => s.setMediaState);
  const setLocalIdentity = useCollaborationStore((s) => s.setLocalIdentity);
  const localUserId = useCollaborationStore((s) => s.localUserId);
  const username = useAuthStore((s) => s.username);

  const [draft, setDraft] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const name = username.trim() || "You";
    setLocalIdentity(localUserId, name);
    return () => {
      mounted.current = false;
      videoManager.disconnect();
    };
  }, [localUserId, setLocalIdentity, username]);

  const localParticipant = useMemo(
    () => ({
      user_id: localUserId,
      name: localDisplayName,
      activity: "editing" as const,
      cursor_color: tokens.colors.track.indigo,
      online: true,
    }),
    [localDisplayName, localUserId],
  );

  const visibleMessages = useMemo(
    () => recentChatMessages(messages, chatExpanded),
    [messages, chatExpanded],
  );

  const onToggleCamera = async () => {
    const enabled = await videoManager.toggleCamera();
    if (mounted.current) setMediaState(enabled, videoManager.isMicEnabled);
  };

  const onToggleMic = async () => {
    const enabled = await videoManager.toggleMic();
    if (mounted.current) setMediaState(videoManager.isCameraEnabled, enabled);
  };

  const onSend = () => {
    sendCollaborationChat(draft);
    setDraft("");
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{
        backgroundColor: tokens.colors.background.surface,
        fontSize: tokens.typography.fontSize.compact,
        color: tokens.colors.text.secondary,
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <SectionHeader>Collaborators</SectionHeader>
        <div className="flex flex-wrap gap-2">
          <CollaboratorTile
            participant={localParticipant}
            showVideo
            videoManager={videoManager}
          />
          {participants.map((participant) => (
            <CollaboratorTile key={participant.user_id} participant={participant} />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <SectionHeader>Session chat</SectionHeader>
          <button
            type="button"
            onClick={() => setChatExpanded(!chatExpanded)}
            style={{
              fontSize: 10,
              color: tokens.colors.accent.cmte,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {chatExpanded ? "Show recent" : "Show all"}
          </button>
        </div>
        <div
          className="mb-2 max-h-40 overflow-auto rounded p-2"
          style={{ backgroundColor: tokens.colors.background.elevated }}
        >
          {visibleMessages.length === 0 ? (
            <div style={{ color: tokens.colors.text.muted, fontSize: 11 }}>No messages yet.</div>
          ) : (
            visibleMessages.map((message) => (
              <div key={message.message_id} className="mb-2 last:mb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span style={{ color: tokens.colors.text.primary, fontSize: 11 }}>
                    {message.author}
                  </span>
                  <span className="font-mono" style={{ color: tokens.colors.text.muted, fontSize: 10 }}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div style={{ fontSize: 11 }}>{message.text}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className="shrink-0 border-t p-3"
        style={{ borderColor: tokens.colors.border.hairline }}
      >
        <div className="mb-2 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSend();
            }}
            placeholder="Message collaborators…"
            className="min-w-0 flex-1 rounded px-2 py-1.5"
            style={{
              backgroundColor: tokens.colors.background.canvas,
              color: tokens.colors.text.primary,
              border: `1px solid ${tokens.colors.border.standard}`,
              fontSize: tokens.typography.fontSize.compact,
            }}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!draft.trim()}
            style={{
              fontSize: tokens.typography.fontSize.compact,
              color: tokens.colors.text.accent,
              backgroundColor: tokens.colors.accent.cmte,
              border: "none",
              borderRadius: 4,
              padding: "6px 10px",
              cursor: draft.trim() ? "pointer" : "default",
              opacity: draft.trim() ? 1 : 0.5,
            }}
          >
            Send
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onToggleCamera()}
            style={mediaButtonStyle(cameraEnabled)}
          >
            {cameraEnabled ? "Camera on" : "Camera off"}
          </button>
          <button
            type="button"
            onClick={() => void onToggleMic()}
            style={mediaButtonStyle(micEnabled)}
          >
            {micEnabled ? "Mic on" : "Mic off"}
          </button>
        </div>
      </div>
    </div>
  );
}

function mediaButtonStyle(active: boolean): CSSProperties {
  return {
    fontSize: 11,
    color: tokens.colors.text.accent,
    backgroundColor: active ? tokens.colors.accent.stable : tokens.colors.background.elevated,
    border: `1px solid ${tokens.colors.border.standard}`,
    borderRadius: 4,
    padding: "4px 8px",
    cursor: "pointer",
  };
}
