import type { PoetBackendStatus } from "@consequence/stream";

interface PoetBackendStatusStripProps {
  status: PoetBackendStatus | null;
}

export function PoetBackendStatusStrip({ status }: PoetBackendStatusStripProps) {
  if (!status) return null;
  const ratio = Math.min(
    1,
    status.estimated_cost_usdc > 0 ? status.accumulated_cost_usdc / status.estimated_cost_usdc : 0,
  );
  const fillClass = ratio > 0.9 ? "fill-cs-rose" : ratio > 0.6 ? "fill-cs-tension" : "fill-cs-primary";

  return (
    <div className="flex h-6 shrink-0 items-center gap-2 border-t border-cs-hairline px-3 font-mono text-[10px] text-cs-muted">
      <span className="truncate">{status.model_id}</span>
      <span>${status.estimated_cost_usdc.toFixed(3)}</span>
      <svg viewBox="0 0 100 4" className="h-1 flex-1" preserveAspectRatio="none" aria-hidden>
        <rect x="0" y="0" width="100" height="4" className="fill-cs-canvas" />
        <rect x="0" y="0" width={ratio * 100} height="4" className={fillClass} />
      </svg>
    </div>
  );
}
