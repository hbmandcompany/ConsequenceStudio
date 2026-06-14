import { create } from "zustand";

export type TrackType = "midi" | "audio" | "instrument";

export interface Track {
  id: string;
  name: string;
  color: string;
  type: TrackType;
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
  updateTrack: (id: string, patch: Partial<Track>) => void;
}

const defaultTracks: Track[] = [
  {
    id: "track-1",
    name: "Piano",
    color: TRACK_COLORS[0],
    type: "instrument",
    muted: false,
    solo: false,
    armed: false,
    locked: false,
    volume: 0.8,
    pan: 0,
    midiChannel: 1,
    peakLevel: 0.3,
    rmsLevel: 0.15,
  },
  {
    id: "track-2",
    name: "Bass",
    color: TRACK_COLORS[2],
    type: "midi",
    muted: false,
    solo: false,
    armed: false,
    locked: false,
    volume: 0.75,
    pan: 0,
    midiChannel: 2,
    peakLevel: 0.5,
    rmsLevel: 0.22,
  },
  {
    id: "track-3",
    name: "Drums",
    color: TRACK_COLORS[6],
    type: "audio",
    muted: false,
    solo: false,
    armed: false,
    locked: false,
    volume: 0.9,
    pan: 0,
    midiChannel: 10,
    peakLevel: 0.7,
    rmsLevel: 0.4,
  },
];

export const useTrackStore = create<TrackState & TrackActions>((set) => ({
  tracks: defaultTracks,
  selectedTrackIds: ["track-1"],
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
  updateTrack: (id, patch) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
}));
