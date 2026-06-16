import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useShallow } from "zustand/shallow";
import type { DoctorDiagnosticPayload } from "@consequence/stream";
import {
  DIAGNOSTIC_CATEGORIES,
  groupDiagnosticsByCategory,
  visibleDiagnostics,
  visibleSuggestions,
  useDoctorStore,
  type DoctorPanelMode,
} from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";
import { DoctorComposeMode } from "./DoctorComposeMode";
import {
  acceptDoctorSuggestion,
  rejectDoctorSuggestion,
  sendDoctorInstruction,
} from "./doctor-actions";

const SEVERITY_COLORS: Record<DoctorDiagnosticPayload["severity"], string> = {
  error: tokens.colors.accent.error,
  warning: tokens.colors.accent.tension,
  info: tokens.colors.accent.cmte,
};

const MODE_OPTIONS: { id: DoctorPanelMode; label: string }[] = [
  { id: "diagnose", label: "Diagnose" },
  { id: "suggest", label: "Suggest" },
  { id: "execute", label: "Execute" },
  { id: "compose", label: "Compose" },
];

function ModeSelector() {
  const mode = useDoctorStore((s) => s.panelMode);
  const setPanelMode = useDoctorStore((s) => s.setPanelMode);

  return (
    <div
      className="flex shrink-0"
      style={{ borderBottom: `1px solid ${tokens.colors.border.hairline}` }}
    >
      {MODE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setPanelMode(option.id)}
          style={{
            flex: 1,
            padding: "8px 0",
            fontSize: tokens.typography.fontSize.compact,
            fontWeight: tokens.typography.fontWeight.medium,
            color: mode === option.id ? tokens.colors.text.accent : tokens.colors.text.secondary,
            background: mode === option.id ? tokens.colors.background.elevated : "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function DiagnoseMode() {
  const diagnostics = useDoctorStore(useShallow((s) => visibleDiagnostics(s)));
  const dismissed = useDoctorStore((s) => s.dismissedDiagnosticIds);
  const dismissDiagnostic = useDoctorStore((s) => s.dismissDiagnostic);
  const jumpToDiagnostic = useDoctorStore((s) => s.jumpToDiagnostic);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const diagnostic of diagnostics) {
      if (diagnostic.resolved && !dismissed.includes(diagnostic.id)) {
        timers.push(setTimeout(() => dismissDiagnostic(diagnostic.id), 300));
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [diagnostics, dismissed, dismissDiagnostic]);

  const grouped = useMemo(() => groupDiagnosticsByCategory(diagnostics), [diagnostics]);

  if (diagnostics.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: tokens.colors.text.muted }}>
        No diagnostics.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {DIAGNOSTIC_CATEGORIES.map((category) => {
        const entries = grouped[category];
        if (entries.length === 0) return null;
        const isCollapsed = collapsed[category] ?? false;
        return (
          <section key={category}>
            <button
              type="button"
              className="mb-1 flex w-full items-center justify-between"
              style={{
                color: tokens.colors.text.primary,
                fontSize: tokens.typography.fontSize.compact,
                fontWeight: tokens.typography.fontWeight.semibold,
                background: "none",
                border: "none",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
              onClick={() => setCollapsed((c) => ({ ...c, [category]: !isCollapsed }))}
            >
              {category}
              <span style={{ color: tokens.colors.text.muted }}>{isCollapsed ? "▸" : "▾"}</span>
            </button>
            {!isCollapsed &&
              entries.map((entry) => (
                <DiagnosticRow
                  key={entry.id}
                  diagnostic={entry}
                  onJump={() => jumpToDiagnostic(entry)}
                />
              ))}
          </section>
        );
      })}
    </div>
  );
}

function DiagnosticRow({
  diagnostic,
  onJump,
}: {
  diagnostic: DoctorDiagnosticPayload;
  onJump: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="mb-2 rounded p-2"
      style={{
        backgroundColor: tokens.colors.background.elevated,
        opacity: diagnostic.resolved ? 0.35 : 1,
        transition: "opacity 300ms ease",
      }}
    >
      <div className="flex items-start gap-2">
        <span style={{ color: SEVERITY_COLORS[diagnostic.severity], fontSize: 12 }}>●</span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="w-full text-left"
            style={{
              color: tokens.colors.text.primary,
              fontSize: tokens.typography.fontSize.compact,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onClick={() => setExpanded((v) => !v)}
          >
            {diagnostic.headline}
          </button>
          {expanded && (
            <p className="mt-1" style={{ color: tokens.colors.text.secondary, fontSize: 11 }}>
              {diagnostic.explanation}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onJump}
          style={{
            fontSize: 10,
            color: tokens.colors.accent.cmte,
            background: "none",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Jump To
        </button>
      </div>
    </div>
  );
}

function SuggestMode() {
  const suggestions = useDoctorStore(useShallow((s) => visibleSuggestions(s)));
  const previewed = useDoctorStore((s) => s.previewedSuggestionIds);
  const togglePreview = useDoctorStore((s) => s.toggleSuggestionPreview);

  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: tokens.colors.text.muted }}>
        No suggestions.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {suggestions.map((suggestion) => {
        const isPreviewed = previewed.includes(suggestion.id);
        return (
          <div
            key={suggestion.id}
            className="rounded p-2"
            style={{ backgroundColor: tokens.colors.background.elevated }}
          >
            <div
              className="mb-2"
              style={{ color: tokens.colors.text.primary, fontSize: tokens.typography.fontSize.compact }}
            >
              {suggestion.headline}
            </div>
            <details>
              <summary style={{ color: tokens.colors.text.muted, fontSize: 11, cursor: "pointer" }}>
                Explanation
              </summary>
              <p className="mt-1" style={{ color: tokens.colors.text.secondary, fontSize: 11 }}>
                {suggestion.explanation}
              </p>
            </details>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => togglePreview(suggestion.id)}
                style={buttonStyle(tokens.colors.accent.doctor)}
              >
                {isPreviewed ? "Hide Preview" : "Preview"}
              </button>
              <button
                type="button"
                onClick={() => acceptDoctorSuggestion(suggestion)}
                style={buttonStyle(tokens.colors.accent.stable)}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => rejectDoctorSuggestion(suggestion.id)}
                style={buttonStyle(tokens.colors.background.surface, true)}
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExecuteMode() {
  const history = useDoctorStore((s) => s.executeHistory);
  const [instruction, setInstruction] = useState("");

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3">
      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder='e.g. "correct all parallel fifths in the current selection"'
        rows={3}
        className="mb-2 w-full resize-none rounded p-2"
        style={{
          backgroundColor: tokens.colors.background.canvas,
          color: tokens.colors.text.primary,
          border: `1px solid ${tokens.colors.border.standard}`,
          fontSize: tokens.typography.fontSize.compact,
          fontFamily: tokens.typography.fontFamily.ui,
        }}
      />
      <button
        type="button"
        disabled={!instruction.trim()}
        onClick={() => {
          sendDoctorInstruction(instruction.trim());
          setInstruction("");
        }}
        style={{
          ...buttonStyle(tokens.colors.accent.doctor),
          opacity: instruction.trim() ? 1 : 0.5,
          alignSelf: "flex-start",
        }}
      >
        Send to Doctor
      </button>
      <div className="mt-4 min-h-0 flex-1 overflow-auto">
        <div
          className="mb-2"
          style={{ color: tokens.colors.text.muted, fontSize: 11, textTransform: "uppercase" }}
        >
          Recent exchanges
        </div>
        {history.length === 0 ? (
          <div style={{ color: tokens.colors.text.muted, fontSize: 11 }}>No instructions yet.</div>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="mb-2 rounded p-2" style={{ backgroundColor: tokens.colors.background.elevated }}>
              <div style={{ color: tokens.colors.text.muted, fontSize: 10 }}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
              <div style={{ color: tokens.colors.text.primary, fontSize: 11 }}>{entry.instruction}</div>
              <div style={{ color: tokens.colors.text.secondary, fontSize: 11 }}>{entry.response}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function buttonStyle(bg: string, outline = false): CSSProperties {
  return {
    fontSize: tokens.typography.fontSize.compact,
    color: tokens.colors.text.accent,
    backgroundColor: outline ? tokens.colors.background.elevated : bg,
    border: outline ? `1px solid ${tokens.colors.border.standard}` : "none",
    borderRadius: 4,
    padding: "4px 8px",
    cursor: "pointer",
  };
}

export function DoctorPanel() {
  const mode = useDoctorStore((s) => s.panelMode);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ModeSelector />
      <div className="min-h-0 flex-1 overflow-auto">
        {mode === "diagnose" && <DiagnoseMode />}
        {mode === "suggest" && <SuggestMode />}
        {mode === "execute" && <ExecuteMode />}
        {mode === "compose" && <DoctorComposeMode />}
      </div>
    </div>
  );
}
