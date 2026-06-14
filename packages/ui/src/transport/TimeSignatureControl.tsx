import { useState } from "react";
import { tokens } from "../design-system/tokens.js";

interface TimeSignatureControlProps {
  timeSignature: [number, number];
  onChange: (ts: [number, number]) => void;
}

export function TimeSignatureControl({ timeSignature, onChange }: TimeSignatureControlProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(`${timeSignature[0]}/${timeSignature[1]}`);

  const commit = () => {
    const [num, den] = draft.split("/").map((v) => Number.parseInt(v, 10));
    if (!Number.isNaN(num) && !Number.isNaN(den)) onChange([num, den]);
    setEditing(false);
  };

  return editing ? (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      style={{
        width: 52,
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
        setDraft(`${timeSignature[0]}/${timeSignature[1]}`);
        setEditing(true);
      }}
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
      {timeSignature[0]}/{timeSignature[1]}
    </button>
  );
}
