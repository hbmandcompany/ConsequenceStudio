import type { GenerationTarget } from "@consequence/stream";
import { Button } from "../../primitives/Button.js";

const TARGETS: GenerationTarget[] = ["VERSE", "HOOK", "BRIDGE", "ADLIB", "LINE", "FREE"];

interface PoetGenerationControlsProps {
  target: GenerationTarget;
  creativeFreedom: number;
  isStreaming: boolean;
  onTarget: (target: GenerationTarget) => void;
  onCreativeFreedom: (value: number) => void;
  onGenerate: () => void;
}

export function PoetGenerationControls({
  target,
  creativeFreedom,
  isStreaming,
  onTarget,
  onCreativeFreedom,
  onGenerate,
}: PoetGenerationControlsProps) {
  return (
    <div className="h-[60px] shrink-0 border-b border-cs-hairline px-3 py-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TARGETS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onTarget(item)}
            className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] ${
              target === item ? "bg-cs-modal text-cs-primary" : "text-cs-secondary"
            }`}
          >
            {item.charAt(0) + item.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-[10px] text-cs-muted">Precise</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.25}
          value={creativeFreedom}
          onChange={(e) => onCreativeFreedom(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-[10px] text-cs-muted">Free</span>
        <Button onClick={onGenerate} disabled={isStreaming}>
          {isStreaming ? "…" : "Generate"}
        </Button>
      </div>
    </div>
  );
}
