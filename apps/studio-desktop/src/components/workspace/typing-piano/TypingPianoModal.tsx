import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  blackKeyLeftPx,
  clampBaseOctave,
  isOctaveDownKey,
  isOctaveUpKey,
  LOGIC_TYPING_KEYS,
  midiForSemitone,
  midiPitchName,
  midiToFrequency,
  msToTicks,
  OCTAVE_DOWN_KEY,
  OCTAVE_UP_KEY,
  octaveRangeLabel,
  pitchFromTypingKey,
  normalizeTypingKey,
  snapTick,
  TICKS_PER_BEAT,
} from "@consequence/audio";
import {
  usePianoRollStore,
  useSessionStore,
  useTrackStore,
  useWorkspaceStore,
} from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

const WHITE_W = 44;
const WHITE_H = 120;
const BLACK_W = 28;
const BLACK_H = 72;

function useTypingPianoAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef<Map<number, { osc: OscillatorNode; gain: GainNode }>>(new Map());

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const noteOn = useCallback(
    (pitch: number, velocity = 100) => {
      const ctx = ensureCtx();
      if (voicesRef.current.has(pitch)) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = midiToFrequency(pitch);
      gain.gain.value = (velocity / 127) * 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      voicesRef.current.set(pitch, { osc, gain });
    },
    [ensureCtx],
  );

  const noteOff = useCallback((pitch: number) => {
    const voice = voicesRef.current.get(pitch);
    if (!voice || !ctxRef.current) return;
    const ctx = ctxRef.current;
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, ctx.currentTime);
    voice.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    voice.osc.stop(ctx.currentTime + 0.08);
    voicesRef.current.delete(pitch);
  }, []);

  useEffect(
    () => () => {
      for (const { osc } of voicesRef.current.values()) {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
      }
      voicesRef.current.clear();
      void ctxRef.current?.close();
      ctxRef.current = null;
    },
    [],
  );

  return { noteOn, noteOff };
}

interface PendingNote {
  pitch: number;
  startTick: number;
  startMs: number;
  velocity: number;
}

interface PianoKeyProps {
  label: string;
  pitch: number;
  black?: boolean;
  pressed: boolean;
  onPress: () => void;
  onRelease: () => void;
}

function PianoKey({ label, pitch, black, pressed, onPress, onRelease }: PianoKeyProps) {
  return (
    <button
      type="button"
      title={midiPitchName(pitch)}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onRelease();
      }}
      onPointerCancel={onRelease}
      onPointerLeave={(e) => {
        if (e.buttons === 0) onRelease();
      }}
      style={{
        position: "relative",
        width: black ? BLACK_W : WHITE_W,
        height: black ? BLACK_H : WHITE_H,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: black ? 8 : 10,
        border: `1px solid ${pressed ? tokens.colors.border.active : tokens.colors.border.standard}`,
        borderRadius: black ? "0 0 4px 4px" : "0 0 6px 6px",
        background: pressed
          ? tokens.colors.text.accent
          : black
            ? "#141414"
            : tokens.colors.pianoRoll.naturalRow,
        color: pressed
          ? tokens.colors.background.canvas
          : black
            ? "#aaa"
            : tokens.colors.text.secondary,
        cursor: "pointer",
        transform: pressed ? "translateY(3px)" : "translateY(0)",
        transition: "transform 45ms ease-out, background 45ms ease-out, box-shadow 45ms ease-out",
        boxShadow: pressed
          ? "inset 0 2px 6px rgba(0,0,0,0.35)"
          : black
            ? "0 3px 6px rgba(0,0,0,0.45)"
            : "0 2px 0 rgba(0,0,0,0.2), inset 0 -1px 0 rgba(255,255,255,0.04)",
        zIndex: black ? 2 : 1,
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontSize: black ? 9 : 10,
          fontWeight: tokens.typography.fontWeight.semibold,
          fontFamily: tokens.typography.fontFamily.mono,
          opacity: pressed ? 1 : 0.85,
        }}
      >
        {label.toUpperCase()}
      </span>
    </button>
  );
}

function LogicPianoKeyboard({
  baseOctave,
  activeKeys,
  onKeyPress,
  onKeyRelease,
}: {
  baseOctave: number;
  activeKeys: Set<string>;
  onKeyPress: (key: string) => void;
  onKeyRelease: (key: string) => void;
}) {
  const whiteKeys = LOGIC_TYPING_KEYS.filter((k) => !k.black);
  const blackKeys = LOGIC_TYPING_KEYS.filter((k) => k.black);
  const whiteSemitones = useMemo(() => whiteKeys.map((k) => k.semitone), [whiteKeys]);
  const totalWhiteW = whiteKeys.length * WHITE_W;

  const blackPositions = useMemo(
    () =>
      blackKeys.map((bk) => ({
        bk,
        left: blackKeyLeftPx(bk.semitone, whiteSemitones, WHITE_W, BLACK_W),
      })),
    [blackKeys, whiteSemitones],
  );

  return (
    <div
      style={{
        position: "relative",
        width: totalWhiteW,
        minWidth: totalWhiteW,
        margin: "0 auto",
        height: WHITE_H,
        overflow: "visible",
      }}
    >
      <div className="flex" style={{ position: "relative", height: WHITE_H, overflow: "visible" }}>
        {whiteKeys.map((wk) => {
          const pitch = midiForSemitone(baseOctave, wk.semitone);
          const pressed = activeKeys.has(wk.key);
          return (
            <PianoKey
              key={wk.key}
              label={wk.key}
              pitch={pitch}
              pressed={pressed}
              onPress={() => onKeyPress(wk.key)}
              onRelease={() => onKeyRelease(wk.key)}
            />
          );
        })}
      </div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
        {blackPositions.map(({ bk, left }) => {
          const pitch = midiForSemitone(baseOctave, bk.semitone);
          const pressed = activeKeys.has(bk.key);
          return (
            <div key={bk.key} style={{ position: "absolute", left, top: 0, pointerEvents: "auto" }}>
              <PianoKey
                label={bk.key}
                pitch={pitch}
                black
                pressed={pressed}
                onPress={() => onKeyPress(bk.key)}
                onRelease={() => onKeyRelease(bk.key)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TypingPianoModal() {
  const open = useWorkspaceStore((s) => s.typingPianoOpen);
  const close = useWorkspaceStore((s) => s.closeTypingPiano);
  const addNote = usePianoRollStore((s) => s.addNote);
  const activeTrackId = usePianoRollStore((s) => s.activeTrackId);
  const tracks = useTrackStore((s) => s.tracks);
  const positionTicks = useSessionStore((s) => s.positionTicks);
  const tempo = useSessionStore((s) => s.tempo);
  const quantization = useWorkspaceStore((s) => s.quantization);
  const snapEnabled = useWorkspaceStore((s) => s.snapEnabled);

  const [recording, setRecording] = useState(false);
  const [baseOctave, setBaseOctave] = useState(4);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(() => new Set());
  const pendingRef = useRef<Map<string, PendingNote>>(new Map());
  const heldKeysRef = useRef<Set<string>>(new Set());
  const recordingRef = useRef(recording);
  const baseOctaveRef = useRef(baseOctave);
  const positionTicksRef = useRef(positionTicks);
  const { noteOn, noteOff } = useTypingPianoAudio();
  const dialogRef = useRef<HTMLDivElement>(null);

  recordingRef.current = recording;
  baseOctaveRef.current = baseOctave;
  positionTicksRef.current = positionTicks;

  const trackId = activeTrackId || tracks[0]?.id || "";
  const trackName = tracks.find((t) => t.id === trackId)?.name ?? "No track";

  const commitNote = useCallback(
    (pending: PendingNote) => {
      if (!trackId) return;
      const elapsed = performance.now() - pending.startMs;
      let duration = Math.max(TICKS_PER_BEAT / 4, msToTicks(elapsed, tempo));
      if (snapEnabled) duration = snapTick(duration, quantization);
      let tick = pending.startTick;
      if (snapEnabled) tick = snapTick(tick, quantization);
      addNote({
        pitch: pending.pitch,
        velocity: pending.velocity,
        tick,
        duration,
        trackId,
      });
    },
    [addNote, quantization, snapEnabled, tempo, trackId],
  );

  const pressKey = useCallback(
    (key: string) => {
      const normalized = normalizeTypingKey(key);
      const pitch = pitchFromTypingKey(normalized, baseOctaveRef.current);
      if (pitch === null) return;
      if (heldKeysRef.current.has(normalized)) return;
      heldKeysRef.current.add(normalized);

      noteOn(pitch);
      setActiveKeys((prev) => new Set(prev).add(normalized));

      if (recordingRef.current) {
        pendingRef.current.set(normalized, {
          pitch,
          startTick: positionTicksRef.current,
          startMs: performance.now(),
          velocity: 100,
        });
      }
    },
    [noteOn],
  );

  const releaseKey = useCallback(
    (key: string) => {
      const normalized = normalizeTypingKey(key);
      const pitch = pitchFromTypingKey(normalized, baseOctaveRef.current);
      if (pitch === null) return;
      if (!heldKeysRef.current.has(normalized)) return;
      heldKeysRef.current.delete(normalized);

      noteOff(pitch);
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(normalized);
        return next;
      });

      const pending = pendingRef.current.get(normalized);
      if (pending) {
        commitNote(pending);
        pendingRef.current.delete(normalized);
      }
    },
    [commitNote, noteOff],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.repeat) return;

      if (isOctaveDownKey(e.key)) {
        e.preventDefault();
        setBaseOctave((o) => clampBaseOctave(o - 1));
        return;
      }
      if (isOctaveUpKey(e.key)) {
        e.preventDefault();
        setBaseOctave((o) => clampBaseOctave(o + 1));
        return;
      }

      const pitch = pitchFromTypingKey(e.key, baseOctaveRef.current);
      if (pitch === null) return;
      e.preventDefault();
      pressKey(normalizeTypingKey(e.key));
    },
    [open, pressKey],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (isOctaveDownKey(e.key) || isOctaveUpKey(e.key)) return;
      const pitch = pitchFromTypingKey(e.key, baseOctaveRef.current);
      if (pitch === null) return;
      e.preventDefault();
      releaseKey(normalizeTypingKey(e.key));
    },
    [open, releaseKey],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [handleKeyDown, handleKeyUp, open]);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      for (const key of [...heldKeysRef.current]) {
        releaseKey(key);
      }
      heldKeysRef.current.clear();
      pendingRef.current.clear();
      setActiveKeys(new Set());
      setRecording(false);
      setBaseOctave(4);
    }
  }, [open, releaseKey]);

  if (!open) return null;

  const controlBtn = (active?: boolean) => ({
    padding: "4px 10px",
    borderRadius: tokens.borderRadius.sm,
    border: `1px solid ${active ? tokens.colors.border.active : tokens.colors.border.standard}`,
    background: active ? tokens.colors.background.elevated : tokens.colors.background.canvas,
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    cursor: "pointer" as const,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={close}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="typing-piano-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxWidth: "96vw",
          background: tokens.colors.background.surface,
          border: `1px solid ${tokens.colors.border.standard}`,
          borderRadius: tokens.borderRadius.lg,
          boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
          overflow: "hidden",
          outline: "none",
        }}
      >
        <div
          className="flex items-center justify-between px-4"
          style={{
            height: 44,
            borderBottom: `1px solid ${tokens.colors.border.hairline}`,
            background: tokens.colors.background.elevated,
          }}
        >
          <div>
            <div
              id="typing-piano-title"
              style={{
                fontSize: tokens.typography.fontSize.compact,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.text.primary,
              }}
            >
              Typing Piano
            </div>
            <div style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted }}>
              {octaveRangeLabel(baseOctave)} · {trackName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRecording((r) => !r)}
              disabled={!trackId}
              title={recording ? "Stop recording to piano roll" : "Record notes to piano roll"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: tokens.borderRadius.sm,
                border: `1px solid ${recording ? tokens.colors.accent.error : tokens.colors.border.standard}`,
                background: recording ? "rgba(200,60,60,0.15)" : tokens.colors.background.canvas,
                color: recording ? tokens.colors.accent.error : tokens.colors.text.secondary,
                fontSize: tokens.typography.fontSize.compact,
                fontWeight: tokens.typography.fontWeight.medium,
                cursor: trackId ? "pointer" : "not-allowed",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: recording ? tokens.colors.accent.error : tokens.colors.text.muted,
                }}
              />
              {recording ? "Recording" : "Record"}
            </button>
            <button type="button" onClick={close} style={{ ...controlBtn(), width: 28, padding: 0 }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 20px 20px" }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted }}>Octave</span>
              <button
                type="button"
                onClick={() => setBaseOctave((o) => clampBaseOctave(o - 1))}
                title={`Octave down (${OCTAVE_DOWN_KEY.toUpperCase()})`}
                style={controlBtn()}
              >
                −
              </button>
              <span
                style={{
                  minWidth: 28,
                  textAlign: "center",
                  fontSize: tokens.typography.fontSize.compact,
                  fontFamily: tokens.typography.fontFamily.mono,
                  color: tokens.colors.text.primary,
                }}
              >
                {baseOctave}
              </span>
              <button
                type="button"
                onClick={() => setBaseOctave((o) => clampBaseOctave(o + 1))}
                title={`Octave up (${OCTAVE_UP_KEY.toUpperCase()})`}
                style={controlBtn()}
              >
                +
              </button>
              <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted, marginLeft: 8 }}>
                {OCTAVE_DOWN_KEY.toUpperCase()} / {OCTAVE_UP_KEY.toUpperCase()} on keyboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBaseOctave((o) => clampBaseOctave(o - 1))}
                style={controlBtn()}
                title="Shift keyboard range down"
              >
                ◀ Range
              </button>
              <button
                type="button"
                onClick={() => setBaseOctave((o) => clampBaseOctave(o + 1))}
                style={controlBtn()}
                title="Shift keyboard range up"
              >
                Range ▶
              </button>
            </div>
          </div>

          <div
            style={{
              overflowX: "auto",
              overflowY: "visible",
              padding: "12px 8px 8px",
              borderRadius: tokens.borderRadius.md,
              background: tokens.colors.background.canvas,
              border: `1px solid ${tokens.colors.border.hairline}`,
            }}
          >
            <LogicPianoKeyboard
              baseOctave={baseOctave}
              activeKeys={activeKeys}
              onKeyPress={pressKey}
              onKeyRelease={releaseKey}
            />
          </div>

          <p style={{ marginTop: 10, fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted }}>
            Play with <span style={{ fontFamily: tokens.typography.fontFamily.mono }}>A – '</span> or click keys.
            Enable <strong style={{ color: tokens.colors.text.secondary }}>Record</strong> to write MIDI to the piano roll.
          </p>

          {!trackId && (
            <div style={{ marginTop: 6, fontSize: tokens.typography.fontSize.xs, color: tokens.colors.accent.error }}>
              Add a track to record notes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
