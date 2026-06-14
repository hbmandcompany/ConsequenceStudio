import { describe, it, expect, beforeEach } from "vitest";
import { collaborationChat, collaborationPresence } from "@consequence/stream";
import { recentChatMessages, useCollaborationStore } from "./collaboration-store.js";

describe("collaboration-store", () => {
  beforeEach(() => {
    useCollaborationStore.setState({
      participantCount: 0,
      participants: [],
      messages: [],
      localUserId: "user-local",
      localDisplayName: "You",
      chatExpanded: false,
      cameraEnabled: false,
      micEnabled: false,
    });
  });

  it("syncs participants and messages from reconstruction", () => {
    if (collaborationPresence.event_type !== "collaboration_presence_event") throw new Error("fixture");
    if (collaborationChat.event_type !== "collaboration_chat_event") throw new Error("fixture");
    useCollaborationStore.getState().syncFromReconstruction({
      participants: [collaborationPresence.payload],
      messages: [collaborationChat.payload],
    });
    const state = useCollaborationStore.getState();
    expect(state.participantCount).toBe(1);
    expect(state.participants[0]?.name).toBe("Alex");
    expect(state.messages[0]?.text).toBe("Check the bridge section");
  });
});

describe("recentChatMessages", () => {
  const messages = Array.from({ length: 7 }, (_, index) => ({
    message_id: `m-${index}`,
    user_id: "u1",
    author: "Alex",
    text: `Message ${index}`,
    timestamp: index,
  }));

  it("returns last five messages when collapsed", () => {
    expect(recentChatMessages(messages, false)).toHaveLength(5);
    expect(recentChatMessages(messages, false)[0]?.text).toBe("Message 2");
  });

  it("returns full history when expanded", () => {
    expect(recentChatMessages(messages, true)).toHaveLength(7);
  });
});
