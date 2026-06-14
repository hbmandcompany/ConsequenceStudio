import { useState } from "react";
import { tokens } from "../design-system/tokens.js";

interface TempoControlProps {
  tempo: number;
  onChange: (tempo: number) => void;
}

export function TempoControl({ tempo, onChange }: TempoControlProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(tempo));

  const commit = () => {
    const value = Number.parseInt(draft, 10);
    if (!Number.isNaN(value)) onChange(value);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-1">
      <span
        style={{
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.text.muted,
          fontFamily: tokens.typography.fontFamily.ui,
        }}
      >
        BPM
      </span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          style={{
            width: 48,
            background: tokens.colors.background.elevated,
            border: `1px solid ${tokens.colors.border.active}`,
            borderRadius: tokens.borderRadius.xs,
            color: tokens.colors.text.primary,
            fontFamily: tokens.typography.fontFamily.mono,
            fontSize: tokens.typography.fontSize.compact,
            padding: "2px 4px",
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(tempo));
            setEditing(true);
          }}
          onWheel={(e) => onChange(tempo + (e.deltaY < 0 ? 1 : -1))}
          style={{
            fontFamily: tokens.typography.fontFamily.mono,
            fontSize: tokens.typography.fontSize.compact,
            color: tokens.colors.text.primary,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          {tempo}
        </button>
      )}
    </div>
  );
}
