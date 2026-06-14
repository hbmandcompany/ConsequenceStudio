import type { PriorLine } from "@consequence/stream";
import { Button } from "../../primitives/Button.js";

interface PoetAcceptedLinesProps {
  branchLabel: string;
  lines: PriorLine[];
  onBranchCreate: () => void;
}

export function PoetAcceptedLines({ branchLabel, lines, onBranchCreate }: PoetAcceptedLinesProps) {
  return (
    <div className="h-40 shrink-0 border-t border-cs-hairline">
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-[11px] text-cs-secondary">{branchLabel}</span>
        <Button variant="ghost" onClick={onBranchCreate}>
          Branch
        </Button>
      </div>
      <div className="h-[calc(100%-28px)] overflow-y-auto px-3">
        {lines.map((line) => (
          <div key={`${line.line_index}-${line.accepted_at}`} className="mb-1 flex items-center gap-2">
            <span className="w-4 font-mono text-[11px] text-cs-muted">{line.line_index + 1}</span>
            <span className="flex-1 text-[12px] text-cs-primary">{line.text}</span>
            <span className="rounded-sm border border-cs-border px-1 text-[10px] text-cs-muted">
              {line.source === "human" ? "H" : "G"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
