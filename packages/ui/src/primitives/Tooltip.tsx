import type { ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-sm border border-cs-border bg-cs-modal px-2 py-1 text-[10px] text-cs-secondary group-hover:block">
        {label}
      </span>
    </span>
  );
}
