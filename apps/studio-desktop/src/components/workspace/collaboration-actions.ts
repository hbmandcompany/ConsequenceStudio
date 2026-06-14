import { getWorkspaceStream } from "../../stream/workspace-stream.js";
import { useCollaborationStore } from "@consequence/state";

export function sendCollaborationChat(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  const { localUserId, localDisplayName } = useCollaborationStore.getState();
  const message = {
    message_id: `msg-${Date.now()}`,
    user_id: localUserId,
    author: localDisplayName,
    text: trimmed,
    timestamp: Date.now(),
  };

  const stream = getWorkspaceStream();
  stream?.stream.sendChatMessage(message);
  stream?.emit({
    event_type: "collaboration_chat_event",
    payload: message,
  });
}
