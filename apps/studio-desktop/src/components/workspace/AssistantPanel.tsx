/**
 * AssistantPanel — Cursor-style flat thread UI.
 *
 * - User messages: right-aligned plain text, no bubble border
 * - Assistant replies: plain text with a small "Studio" label
 * - Doctor suggestion edits: mini diff cards like Cursor (Apply · Dismiss · Score · Reasoning)
 * - @ mention dropdown opens on "@" keypress
 */

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useShallow } from "zustand/shallow";
import {
  usePianoRollStore,
  useWorkspaceStore,
  type AssistantContext,
} from "@consequence/state";
import type { DoctorSuggestionPayload } from "@consequence/stream";
import type { PianoRollNote } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";
import {
  acceptDoctorSuggestion,
  rejectDoctorSuggestion,
  sendDoctorInstruction,
} from "./doctor-actions";
import { sendAssistantMessage } from "./assistant-actions";

// ─── colour / typography shortcuts ──────────────────────────────────────────

const TEXT = tokens.colors.text;
const BG = tokens.colors.background;
const BORDER = tokens.colors.border;
const FONT_UI = tokens.typography.fontFamily.ui;
const FONT_MONO = tokens.typography.fontFamily.mono;
const FONT = tokens.typography.fontSize;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  contexts: AssistantContext[];
  suggestions?: DoctorSuggestionPayload[];
}

// ─── Context metadata ────────────────────────────────────────────────────────

const CONTEXT_META: Record<AssistantContext, { label: string; color: string; description: string }> = {
  doctor: {
    label: "Doctor",
    color: tokens.colors.accent.doctor,
    description: "Harmonic diagnostics & fix suggestions",
  },
  analysis: {
    label: "Analysis",
    color: tokens.colors.accent.cmte,
    description: "Key, chord, tension & scale data",
  },
  poet: {
    label: "Poet",
    color: tokens.colors.track.violet,
    description: "Lyric / melodic generation state",
  },
  ledger: {
    label: "Ledger",
    color: tokens.colors.accent.stable,
    description: "Earnings, compute & market data",
  },
};

const ALL_CONTEXTS: AssistantContext[] = ["doctor", "analysis", "poet", "ledger"];

// ─── Mini piano-roll score preview ───────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function MiniScore({ notes }: { notes: PianoRollNote[] }) {
  if (notes.length === 0) {
    return (
      <div
        style={{
          padding: "10px 12px",
          fontSize: FONT.xs,
          color: TEXT.muted,
          fontFamily: FONT_MONO,
          background: BG.canvas,
          borderTop: `1px solid ${BORDER.hairline}`,
        }}
      >
        No notes available
      </div>
    );
  }

  const minPitch = Math.min(...notes.map((n) => n.pitch));
  const maxPitch = Math.max(...notes.map((n) => n.pitch));
  const maxTick = Math.max(...notes.map((n) => n.tick + n.duration));
  const rows = maxPitch - minPitch + 1;
  const ROW_H = 5;
  const HEIGHT = Math.max(rows * ROW_H, 40);
  const WIDTH = 280;

  return (
    <div
      style={{
        background: BG.canvas,
        borderTop: `1px solid ${BORDER.hairline}`,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: FONT.xs,
          color: TEXT.muted,
          fontFamily: FONT_MONO,
          marginBottom: 6,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Score preview</span>
        <span>
          {noteName(minPitch)}–{noteName(maxPitch)} · {notes.length} notes
        </span>
      </div>
      <div style={{ position: "relative", height: HEIGHT, width: WIDTH, overflow: "hidden" }}>
        {notes.map((n) => {
          const left = maxTick > 0 ? (n.tick / maxTick) * WIDTH : 0;
          const width = maxTick > 0 ? Math.max((n.duration / maxTick) * WIDTH, 2) : 2;
          const top = (maxPitch - n.pitch) * ROW_H;
          return (
            <div
              key={n.id}
              style={{
                position: "absolute",
                left,
                top,
                width,
                height: ROW_H - 1,
                borderRadius: 1,
                background: `rgba(180,190,255,${0.4 + (n.velocity / 127) * 0.5})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Suggestion diff card (Cursor-style) ─────────────────────────────────────

function SuggestionCard({
  suggestion,
  notes,
}: {
  suggestion: DoctorSuggestionPayload;
  notes: PianoRollNote[];
}) {
  const [showScore, setShowScore] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const relatedNotes = notes.filter((n) => n.trackId === notes[0]?.trackId).slice(0, 16);

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${BORDER.standard}`,
        background: BG.elevated,
        overflow: "hidden",
        fontSize: FONT.compact,
        fontFamily: FONT_UI,
      }}
    >
      {/* Header row: label + action strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderBottom: `1px solid ${BORDER.hairline}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: tokens.colors.accent.doctor,
              flexShrink: 0,
            }}
          />
          <span style={{ color: TEXT.primary, fontWeight: tokens.typography.fontWeight.medium }}>
            {suggestion.headline}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Score toggle */}
          <button
            type="button"
            onClick={() => setShowScore((v) => !v)}
            title="Preview affected notes"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 7px",
              borderRadius: 4,
              border: `1px solid ${showScore ? tokens.colors.accent.cmte : BORDER.standard}`,
              background: showScore ? `${tokens.colors.accent.cmte}22` : "transparent",
              color: showScore ? tokens.colors.accent.cmte : TEXT.muted,
              fontSize: FONT.xs,
              cursor: "pointer",
              fontFamily: FONT_UI,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <rect x="1" y="5" width="2" height="4" fill="currentColor" rx="0.5"/>
              <rect x="4" y="3" width="2" height="6" fill="currentColor" rx="0.5"/>
              <rect x="7" y="1" width="2" height="8" fill="currentColor" rx="0.5"/>
            </svg>
            Score
          </button>
          {/* Reasoning toggle */}
          <button
            type="button"
            onClick={() => setShowReasoning((v) => !v)}
            title="Show reasoning"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 7px",
              borderRadius: 4,
              border: `1px solid ${showReasoning ? tokens.colors.track.violet : BORDER.standard}`,
              background: showReasoning ? `${tokens.colors.track.violet}22` : "transparent",
              color: showReasoning ? tokens.colors.track.violet : TEXT.muted,
              fontSize: FONT.xs,
              cursor: "pointer",
              fontFamily: FONT_UI,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <circle cx="5" cy="4" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <rect x="4.3" y="7.5" width="1.4" height="1.5" fill="currentColor" rx="0.5"/>
            </svg>
            Why
          </button>
        </div>
      </div>

      {/* Reasoning section */}
      {showReasoning && (
        <div
          style={{
            padding: "9px 12px",
            background: BG.canvas,
            borderBottom: `1px solid ${BORDER.hairline}`,
            fontSize: FONT.xs,
            color: TEXT.secondary,
            fontFamily: FONT_MONO,
            lineHeight: 1.55,
          }}
        >
          {suggestion.explanation ||
            "This suggestion corrects a harmonic conflict detected by ConsequenceDoctor. Applying it will adjust note pitches to conform to the current key signature without altering rhythm or velocity."}
        </div>
      )}

      {/* Score preview */}
      {showScore && <MiniScore notes={relatedNotes} />}

      {/* Apply / Dismiss */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "8px 10px",
          borderTop: showScore || showReasoning ? `1px solid ${BORDER.hairline}` : undefined,
        }}
      >
        <button
          type="button"
          onClick={() => acceptDoctorSuggestion(suggestion)}
          style={{
            flex: 1,
            padding: "5px 0",
            borderRadius: 5,
            border: "none",
            background: tokens.colors.accent.stable,
            color: "#d8f0d8",
            fontSize: FONT.xs,
            fontFamily: FONT_UI,
            fontWeight: tokens.typography.fontWeight.medium,
            cursor: "pointer",
          }}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => rejectDoctorSuggestion(suggestion.id)}
          style={{
            flex: 1,
            padding: "5px 0",
            borderRadius: 5,
            border: `1px solid ${BORDER.standard}`,
            background: "transparent",
            color: TEXT.secondary,
            fontSize: FONT.xs,
            fontFamily: FONT_UI,
            cursor: "pointer",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Context pill in the input box ───────────────────────────────────────────
// Cursor-style: no "@" prefix, dot + label + × inside one unified composer box.

function ContextPill({
  context,
  onRemove,
}: {
  context: AssistantContext;
  onRemove: () => void;
}) {
  const meta = CONTEXT_META[context];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1px 6px 1px 5px",
        borderRadius: 4,
        fontSize: FONT.xs,
        color: TEXT.secondary,
        background: BG.modal,
        border: `1px solid ${BORDER.standard}`,
        fontFamily: FONT_UI,
        lineHeight: "18px",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: meta.color,
          flexShrink: 0,
        }}
      />
      {meta.label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${meta.label}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 12,
          height: 12,
          marginLeft: 1,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: TEXT.muted,
          cursor: "pointer",
          fontSize: 9,
          padding: 0,
        }}
      >
        ×
      </button>
    </span>
  );
}

// ─── @mention dropdown ───────────────────────────────────────────────────────

function MentionDropdown({
  query,
  activeContexts,
  highlightIdx,
  onSelect,
}: {
  query: string;
  activeContexts: AssistantContext[];
  highlightIdx: number;
  onSelect: (ctx: AssistantContext) => void;
}) {
  const filtered = ALL_CONTEXTS.filter((c) =>
    CONTEXT_META[c].label.toLowerCase().startsWith(query.toLowerCase()),
  );

  if (filtered.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Context sources"
      style={{
        position: "absolute",
        bottom: "calc(100% + 6px)",
        left: 0,
        right: 0,
        background: BG.modal,
        border: `1px solid ${BORDER.standard}`,
        borderRadius: 8,
        boxShadow: "0 8px 28px rgba(0,0,0,0.6)",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: "5px 10px 4px",
          fontSize: FONT.xs,
          color: TEXT.muted,
          fontFamily: FONT_MONO,
          borderBottom: `1px solid ${BORDER.hairline}`,
        }}
      >
        Add context source
      </div>
      {filtered.map((ctx, i) => {
        const meta = CONTEXT_META[ctx];
        const isActive = activeContexts.includes(ctx);
        return (
          <button
            key={ctx}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onSelect(ctx)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 12px",
              border: "none",
              cursor: "pointer",
              background: i === highlightIdx ? BG.elevated : "transparent",
              textAlign: "left",
            }}
          >
            <span
              style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color, flexShrink: 0 }}
            />
            <span style={{ flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontSize: FONT.compact,
                  color: TEXT.primary,
                  fontFamily: FONT_UI,
                }}
              >
                {meta.label}
              </span>
              <span style={{ display: "block", fontSize: FONT.xs, color: TEXT.muted }}>
                {meta.description}
              </span>
            </span>
            {isActive && (
              <span style={{ fontSize: FONT.xs, color: meta.color, fontFamily: FONT_MONO }}>
                active
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Single message row ───────────────────────────────────────────────────────

function MessageRow({
  message,
  notes,
}: {
  message: ChatMessage;
  notes: PianoRollNote[];
}) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: isUser ? "0 4px 0 32px" : "0 4px",
      }}
    >
      {/* Role label */}
      {!isUser && (
        <span
          style={{
            fontSize: FONT.xs,
            color: TEXT.muted,
            fontFamily: FONT_MONO,
            marginBottom: 2,
          }}
        >
          Studio
        </span>
      )}

      {/* Plain text body */}
      <p
        style={{
          margin: 0,
          fontSize: FONT.compact,
          fontFamily: FONT_UI,
          lineHeight: 1.6,
          color: isUser ? TEXT.secondary : TEXT.primary,
          whiteSpace: "pre-wrap",
          textAlign: isUser ? "right" : "left",
        }}
      >
        {message.text}
      </p>

      {/* Context labels shown under user messages */}
      {isUser && message.contexts.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 2 }}>
          {message.contexts.map((c) => (
            <span
              key={c}
              style={{ fontSize: 9, color: CONTEXT_META[c].color, fontFamily: FONT_MONO }}
            >
              {CONTEXT_META[c].label}
            </span>
          ))}
        </div>
      )}

      {/* Edit cards */}
      {message.suggestions && message.suggestions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
          {message.suggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} notes={notes} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function AssistantPanel() {
  const assistantContext = useWorkspaceStore((s) => s.assistantContext);
  const toggleAssistantContext = useWorkspaceStore((s) => s.toggleAssistantContext);

  const notes = usePianoRollStore(useShallow((s) => s.notes));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const atIdx = value.lastIndexOf("@");
    if (atIdx === -1 || value.slice(atIdx + 1).includes(" ")) {
      setMentionQuery(null);
    } else {
      setMentionQuery(value.slice(atIdx + 1));
      setHighlightIdx(0);
    }
  };

  const acceptMention = (ctx: AssistantContext) => {
    const atIdx = draft.lastIndexOf("@");
    setDraft(draft.slice(0, atIdx));
    setMentionQuery(null);
    if (!assistantContext.includes(ctx)) toggleAssistantContext(ctx);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const filteredMentions = ALL_CONTEXTS.filter(
    (c) => !mentionQuery || CONTEXT_META[c].label.toLowerCase().startsWith(mentionQuery.toLowerCase()),
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, filteredMentions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); if (filteredMentions[highlightIdx]) acceptMention(filteredMentions[highlightIdx]); return; }
      if (e.key === "Escape") { e.preventDefault(); setMentionQuery(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const send = () => {
    const text = draft.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text, contexts: [...assistantContext] };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      contexts: [...assistantContext],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setDraft("");
    setMentionQuery(null);
    setIsStreaming(true);

    const lower = text.toLowerCase();
    if (assistantContext.includes("doctor") && /fix|correct|resolve|clean|suggest/.test(lower)) {
      sendDoctorInstruction(text);
    }

    sendAssistantMessage(text, assistantContext, {
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + token } : m)),
        );
      },
      onDone: (editSuggestions) => {
        setIsStreaming(false);
        if (editSuggestions?.length) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, suggestions: editSuggestions } : m,
            ),
          );
        }
      },
      onError: (message) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: m.text || `Conductor unavailable: ${message}` }
              : m,
          ),
        );
      },
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        fontFamily: FONT_UI,
      }}
    >
      {/* ── Thread ──────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {messages.map((m, i) => (
          <div key={m.id}>
            {/* Thin separator between assistant and next user message */}
            {i > 0 && m.role === "user" && (
              <div
                style={{
                  height: 1,
                  background: BORDER.hairline,
                  margin: "-9px 0 16px",
                }}
              />
            )}
            <MessageRow message={m} notes={notes} />
          </div>
        ))}
      </div>

      {/* ── Input (Cursor-style single composer box) ────── */}
      <div
        style={{
          flexShrink: 0,
          borderTop: `1px solid ${BORDER.hairline}`,
          padding: "10px 12px",
        }}
      >
        <div style={{ position: "relative" }}>
          {/* @mention dropdown — floats above the composer */}
          {mentionQuery !== null && (
            <MentionDropdown
              query={mentionQuery}
              activeContexts={assistantContext}
              highlightIdx={highlightIdx}
              onSelect={acceptMention}
            />
          )}

          {/*
           * Single unified composer box:
           *   ┌─────────────────────────────────┐
           *   │ [Doctor ×] [Analysis ×] …       │  ← pills row (when context active)
           *   │─────────────────────────────────│  ← hairline
           *   │ textarea…                   [↑] │
           *   └─────────────────────────────────┘
           */}
          <div
            style={{
              background: BG.elevated,
              border: `1px solid ${BORDER.standard}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Pills row — only shown when context is active */}
            {assistantContext.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  padding: "7px 10px 6px",
                  borderBottom: `1px solid ${BORDER.hairline}`,
                }}
              >
                {assistantContext.map((ctx) => (
                  <ContextPill key={ctx} context={ctx} onRemove={() => toggleAssistantContext(ctx)} />
                ))}
              </div>
            )}

            {/* Textarea + send button */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 6,
                padding: "8px 8px 8px 10px",
              }}
            >
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Message… (@ to add context)"
                style={{
                  flex: 1,
                  resize: "none",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: TEXT.primary,
                  fontSize: FONT.compact,
                  fontFamily: FONT_UI,
                  lineHeight: 1.5,
                  minHeight: 0,
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim() || isStreaming}
                style={{
                  width: 26,
                  height: 26,
                  flexShrink: 0,
                  borderRadius: 5,
                  border: "none",
                  cursor: draft.trim() ? "pointer" : "default",
                  background: draft.trim() ? TEXT.accent : BG.canvas,
                  color: draft.trim() ? BG.canvas : TEXT.muted,
                  fontSize: 14,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.12s",
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
