/** Logic Pro–style musical typing — one chromatic row, octave via Z / X. */

export interface TypingKeyDef {
  /** Computer keyboard key (lowercase). */
  key: string;
  /** Semitone offset from C within the mapped span (0 = C). */
  semitone: number;
  black?: boolean;
}

/** Single-row mapping matching Logic Pro Musical Typing. */
export const LOGIC_TYPING_KEYS: readonly TypingKeyDef[] = [
  { key: "a", semitone: 0 },
  { key: "w", semitone: 1, black: true },
  { key: "s", semitone: 2 },
  { key: "e", semitone: 3, black: true },
  { key: "d", semitone: 4 },
  { key: "f", semitone: 5 },
  { key: "t", semitone: 6, black: true },
  { key: "g", semitone: 7 },
  { key: "y", semitone: 8, black: true },
  { key: "h", semitone: 9 },
  { key: "u", semitone: 10, black: true },
  { key: "j", semitone: 11 },
  { key: "k", semitone: 12 },
  { key: "o", semitone: 13, black: true },
  { key: "l", semitone: 14 },
  { key: "p", semitone: 15, black: true },
  { key: ";", semitone: 16 },
  { key: "'", semitone: 17 },
];

export const OCTAVE_DOWN_KEY = "z";
export const OCTAVE_UP_KEY = "x";

const KEY_BY_CHAR = new Map(LOGIC_TYPING_KEYS.map((k) => [k.key, k]));

export function normalizeTypingKey(key: string): string {
  const k = key.toLowerCase();
  if (k === "quote") return "'";
  return k;
}

/** MIDI note for C in a given octave number (C4 = 60 → octave 4). */
export function midiForSemitone(baseOctave: number, semitone: number): number {
  return 12 * (baseOctave + 1) + semitone;
}

export function pitchFromTypingKey(key: string, baseOctave: number): number | null {
  const def = KEY_BY_CHAR.get(normalizeTypingKey(key));
  if (!def) return null;
  return midiForSemitone(baseOctave, def.semitone);
}

export function isOctaveDownKey(key: string): boolean {
  return key.toLowerCase() === OCTAVE_DOWN_KEY;
}

export function isOctaveUpKey(key: string): boolean {
  return key.toLowerCase() === OCTAVE_UP_KEY;
}

export function clampBaseOctave(octave: number): number {
  return Math.max(0, Math.min(8, octave));
}

export function octaveRangeLabel(baseOctave: number): string {
  const low = midiForSemitone(baseOctave, 0);
  const high = midiForSemitone(baseOctave, LOGIC_TYPING_KEYS[LOGIC_TYPING_KEYS.length - 1].semitone);
  return `${midiPitchName(low)} – ${midiPitchName(high)}`;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiPitchName(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export function midiToFrequency(pitch: number): number {
  return 440 * 2 ** ((pitch - 69) / 12);
}

/** Convert elapsed milliseconds at a given BPM to MIDI ticks (480 PPQ). */
export function msToTicks(ms: number, tempoBpm: number): number {
  return Math.round((ms * tempoBpm * 480) / 60_000);
}

/** Index of the white key immediately left of a black key in the mapped layout. */
export function blackKeyAnchorWhiteIndex(blackSemitone: number, whiteSemitones: readonly number[]): number {
  let anchor = 0;
  for (let i = 0; i < whiteSemitones.length; i++) {
    if (whiteSemitones[i] < blackSemitone) anchor = i;
    else break;
  }
  return anchor;
}

/** Pixel offset for a black key between two white keys. */
export function blackKeyLeftPx(
  blackSemitone: number,
  whiteSemitones: readonly number[],
  whiteKeyWidth: number,
  blackKeyWidth: number,
): number {
  const anchor = blackKeyAnchorWhiteIndex(blackSemitone, whiteSemitones);
  return anchor * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2;
}

/** @deprecated Use blackKeyAnchorWhiteIndex */
export function whiteKeyIndex(semitone: number): number {
  const pc = semitone % 12;
  const octave = Math.floor(semitone / 12);
  const map: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
  return octave * 7 + (map[pc] ?? 0);
}

/** @deprecated Use LOGIC_TYPING_KEYS */
export const TYPING_PIANO_KEY_MAP: Readonly<Record<string, number>> = Object.fromEntries(
  LOGIC_TYPING_KEYS.map((k) => [k.key, midiForSemitone(4, k.semitone)]),
);

/** @deprecated Use LOGIC_TYPING_KEYS */
export const TYPING_PIANO_ROWS = [LOGIC_TYPING_KEYS.map((k) => ({ ...k, pitch: midiForSemitone(4, k.semitone) }))];
