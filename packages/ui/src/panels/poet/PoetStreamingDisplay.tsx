import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { usePoetStore } from "@consequence/state";
import { Button } from "../../primitives/Button.js";
import { PoetLineRow } from "./PoetLineRow.js";

interface PoetStreamingDisplayProps {
  showSupervision: boolean;
  onAcceptLine: (lineIndex: number) => void;
  onRejectLine: (lineIndex: number) => void;
  onEditLine: (lineIndex: number, text: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function PoetStreamingDisplay({
  showSupervision,
  onAcceptLine,
  onRejectLine,
  onEditLine,
  onAcceptAll,
  onRejectAll,
}: PoetStreamingDisplayProps) {
  const { streaming_lines, completed_lines, supervision_pending } = usePoetStore(
    useShallow((s) => ({
      streaming_lines: s.streaming_lines,
      completed_lines: s.completed_lines,
      supervision_pending: s.supervision_pending,
    })),
  );

  const indices = useMemo(() => {
    const keys = new Set([
      ...Object.keys(streaming_lines).map(Number),
      ...Object.keys(completed_lines).map(Number),
    ]);
    return [...keys].sort((a, b) => a - b);
  }, [streaming_lines, completed_lines]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {indices.length === 0 ? (
        <p className="px-3 py-4 text-[12px] text-cs-muted">Generate lyrics to begin streaming.</p>
      ) : (
        indices.map((index) => {
          const streaming = streaming_lines[index];
          const completed = completed_lines[index];
          const text = streaming ?? completed?.text ?? "";
          return (
            <PoetLineRow
              key={index}
              lineIndex={index}
              text={text}
              streaming={Boolean(streaming)}
              line={completed}
              showSupervision={showSupervision}
              onAccept={() => onAcceptLine(index)}
              onReject={() => onRejectLine(index)}
              onEdit={(value) => onEditLine(index, value)}
            />
          );
        })
      )}
      {supervision_pending ? (
        <div className="sticky bottom-0 flex gap-2 border-t border-cs-hairline bg-cs-surface px-2 py-2">
          <Button onClick={onAcceptAll}>Accept All</Button>
          <Button onClick={onRejectAll}>Reject All</Button>
        </div>
      ) : null}
    </div>
  );
}
