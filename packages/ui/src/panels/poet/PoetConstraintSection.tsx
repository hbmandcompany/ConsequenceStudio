import type { ConstraintSet } from "@consequence/stream";
import { Button } from "../../primitives/Button.js";

interface PoetConstraintSectionProps {
  open: boolean;
  locked: boolean;
  constraints: ConstraintSet;
  onToggle: () => void;
  onChange: (constraints: ConstraintSet) => void;
  onLock: () => void;
}

export function PoetConstraintSection({
  open,
  locked,
  constraints,
  onToggle,
  onChange,
  onLock,
}: PoetConstraintSectionProps) {
  return (
    <div className="border-b border-cs-hairline px-3 py-2">
      <button type="button" className="flex w-full items-center justify-between text-[11px] text-cs-secondary" onClick={onToggle}>
        <span>Constraints {locked ? "🔒" : ""}</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          <input
            className="w-full rounded-sm border border-cs-border bg-cs-surface px-2 py-1 text-[12px] text-cs-primary disabled:opacity-60"
            placeholder="Rhyme scheme (ABAB)"
            disabled={locked}
            value={constraints.rhyme_scheme ?? ""}
            onChange={(e) => onChange({ ...constraints, rhyme_scheme: e.target.value })}
          />
          <input
            className="w-full rounded-sm border border-cs-border bg-cs-surface px-2 py-1 text-[12px] text-cs-primary disabled:opacity-60"
            placeholder="Syllables per line (8,10,8,10)"
            disabled={locked}
            value={(constraints.target_syllable_counts ?? []).join(",")}
            onChange={(e) =>
              onChange({
                ...constraints,
                target_syllable_counts: e.target.value
                  .split(",")
                  .map((v) => Number(v.trim()))
                  .filter((v) => !Number.isNaN(v)),
              })
            }
          />
          <input
            className="w-full rounded-sm border border-cs-border bg-cs-surface px-2 py-1 text-[12px] text-cs-primary disabled:opacity-60"
            placeholder="Meter pattern"
            disabled={locked}
            value={constraints.meter_pattern ?? ""}
            onChange={(e) => onChange({ ...constraints, meter_pattern: e.target.value })}
          />
          <Button onClick={onLock} disabled={locked}>
            Lock Constraints
          </Button>
        </div>
      ) : null}
    </div>
  );
}
