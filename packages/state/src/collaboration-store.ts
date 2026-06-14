import { create } from "zustand";
import type { CollaborationChatPayload, CollaborationPresencePayload } from "@consequence/stream";

export interface CollaborationState {
  participantCount: number;
  participants: CollaborationPresencePayload[];
  messages: CollaborationChatPayload[];
  localUserId: string;
  localDisplayName: string;
  chatExpanded: boolean;
  cameraEnabled: boolean;
  micEnabled: boolean;
}

export interface CollaborationActions {
  syncFromReconstruction: (collaboration: {
    participants: CollaborationPresencePayload[];
    messages: CollaborationChatPayload[];
  }) => void;
  setLocalIdentity: (userId: string, displayName: string) => void;
  setChatExpanded: (expanded: boolean) => void;
  setMediaState: (cameraEnabled: boolean, micEnabled: boolean) => void;
}

export const useCollaborationStore = create<CollaborationState & CollaborationActions>((set) => ({
  participantCount: 0,
  participants: [],
  messages: [],
  localUserId: "user-local",
  localDisplayName: "You",
  chatExpanded: false,
  cameraEnabled: false,
  micEnabled: false,
  syncFromReconstruction: (collaboration) =>
    set({
      participants: collaboration.participants,
      messages: collaboration.messages,
      participantCount: collaboration.participants.length,
    }),
  setLocalIdentity: (localUserId, localDisplayName) => set({ localUserId, localDisplayName }),
  setChatExpanded: (chatExpanded) => set({ chatExpanded }),
  setMediaState: (cameraEnabled, micEnabled) => set({ cameraEnabled, micEnabled }),
}));

export function recentChatMessages(
  messages: CollaborationChatPayload[],
  expanded: boolean,
): CollaborationChatPayload[] {
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  return expanded ? sorted : sorted.slice(-5);
}
