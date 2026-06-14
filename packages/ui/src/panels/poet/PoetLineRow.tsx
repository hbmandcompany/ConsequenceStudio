import { memo, useLayoutEffect, useRef, useState } from "react";
import type { GeneratedLine } from "@consequence/stream";
import { Button } from "../../primitives/Button.js";
import { Tooltip } from "../../primitives/Tooltip.js";

interface PoetLineRowProps {
  lineIndex: number;
  text: string;
  streaming: boolean;
  line?: GeneratedLine;
  showSupervision: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: (text: string) => void;
}

export const PoetLineRow = memo(function PoetLineRow({
  lineIndex,
  text,
  streaming,
  line,
  showSupervision,
  onAccept,
  onReject,
  onEdit,
}: PoetLineRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  useLayoutEffect(() => {
    if (!rowRef.current) return;
    rowRef.current.dataset.domUpdatedAt = String(performance.now());
  }, [text, streaming, line?.supervision_state]);

  const violations = line?.constraint_compliance.violations ?? [];
  const compliant =
    line?.constraint_compliance.rhyme_scheme_satisfied &&
    line?.constraint_compliance.syllable_count_satisfied &&
    violations.length === 0;

  return (
    <div ref={rowRef} data-line-index={lineIndex} className="min-h-14 border-b border-cs-hairline px-2 py-1">
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            className="flex-1 rounded-sm border border-cs-border bg-cs-surface px-2 py-1 text-[13px] text-cs-primary"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEdit?.(draft);
                setEditing(false);
              }
            }}
          />
        ) : (
          <p className="flex-1 text-[13px] font-normal text-cs-primary">
            {text}
            {streaming ? <span className="ml-1 animate-poet-pulse">▍</span> : null}
          </p>
        )}
        {showSupervision && line?.supervision_state === "PENDING" ? (
          <div className="flex gap-1">
            <Button variant="icon" onClick={onAccept}>✓</Button>
            <Button variant="icon" onClick={onReject}>✕</Button>
            <Button variant="icon" onClick={() => setEditing(true)}>✎</Button>
          </div>
        ) : null}
      </div>
      {line ? (
        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-cs-muted">
          <span>{line.syllable_count} syl</span>
          {line.rhyme_class ? <span className="rounded-sm border border-cs-border px-1">{line.rhyme_class}</span> : null}
          <Tooltip label={violations.join(", ") || "All constraints satisfied"}>
            <span className={`h-2 w-2 rounded-full ${compliant ? "bg-cs-stable" : "bg-cs-tension"}`} />
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
});
