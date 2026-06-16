import { create } from "zustand";
import { useArrangementStore } from "./arrangement-store.js";
import { usePianoRollStore } from "./piano-roll-store.js";

export type TrackType = "midi" | "audio" | "instrument";

export interface Track {
  id: string;
  name: string;
  color: string;
  type: TrackType;
  instrument: string;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  locked: boolean;
  volume: number;
  pan: number;
  midiChannel: number;
  peakLevel: number;
  rmsLevel: number;
}

/** Desaturated track palette per specification. */
export const TRACK_COLORS = [
  "#3A5A7A",
  "#3A6A6A",
  "#4A7A4A",
  "#5A7A3A",
  "#7A6A3A",
  "#7A5A3A",
  "#7A3A3A",
  "#7A3A4A",
  "#5A3A7A",
  "#3A4A7A",
  "#3A6A7A",
  "#6A3A7A",
] as const;

export interface TrackState {
  tracks: Track[];
  selectedTrackIds: string[];
}

export interface TrackActions {
  selectTrack: (id: string, additive?: boolean) => void;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
  toggleArm: (id: string) => void;
  toggleLock: (id: string) => void;
  reorderTrack: (fromIndex: number, toIndex: number) => void;
  addTrack: (type?: TrackType) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
}

export const DEFAULT_INSTRUMENT: Record<TrackType, string> = {
  midi: "External MIDI",
  audio: "Audio Input",
  instrument: "Consequence Instrument",
};

export const useTrackStore = create<TrackState & TrackActions>((set, get) => ({
  tracks: [],
  selectedTrackIds: [],
  selectTrack: (id, additive = false) =>
    set((state) => ({
      selectedTrackIds: additive
        ? state.selectedTrackIds.includes(id)
          ? state.selectedTrackIds.filter((t) => t !== id)
          : [...state.selectedTrackIds, id]
        : [id],
    })),
  toggleMute: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t)),
    })),
  toggleSolo: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, solo: !t.solo } : t)),
    })),
  toggleArm: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, armed: !t.armed } : t)),
    })),
  toggleLock: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, locked: !t.locked } : t)),
    })),
  reorderTrack: (fromIndex, toIndex) =>
    set((state) => {
      const tracks = [...state.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, moved);
      return { tracks };
    }),
  addTrack: (type = "midi") =>
    set((state) => {
      const index = state.tracks.length;
      const track: Track = {
        id: `track-${Date.now()}`,
        name: `Track ${index + 1}`,
        color: TRACK_COLORS[index % TRACK_COLORS.length],
        type,
        instrument: DEFAULT_INSTRUMENT[type],
        muted: false,
        solo: false,
        armed: false,
        locked: false,
        volume: 0.8,
        pan: 0,
        midiChannel: (index % 16) + 1,
        peakLevel: 0,
        rmsLevel: 0,
      };
      return { tracks: [...state.tracks, track], selectedTrackIds: [track.id] };
    }),
  removeTrack: (id) => {
    set((state) => {
      const tracks = state.tracks.filter((t) => t.id !== id);
      const selectedTrackIds = state.selectedTrackIds.filter((tid) => tid !== id);
      const nextSelection =
        selectedTrackIds.length > 0
          ? selectedTrackIds
          : tracks[0]
            ? [tracks[0].id]
            : [];
      return { tracks, selectedTrackIds: nextSelection };
    });
    const arrangement = useArrangementStore.getState();
    arrangement.selectClips([]);
    useArrangementStore.setState({
      clips: arrangement.clips.filter((c) => c.trackId !== id),
    });
    const piano = usePianoRollStore.getState();
    const notes = piano.notes.filter((n) => n.trackId !== id);
    piano.syncFromReconstruction(notes);
    if (piano.activeTrackId === id) {
      piano.setActiveTrackId(get().tracks[0]?.id ?? "");
    }
  },
  updateTrack: (id, patch) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
}));
