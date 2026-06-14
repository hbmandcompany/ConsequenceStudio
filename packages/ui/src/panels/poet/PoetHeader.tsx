import type { PoetConnectionState, SessionMode, SupervisionMode } from "@consequence/stream";
import { Toggle } from "../../primitives/Toggle.js";

const CONNECTION_COLOR: Record<PoetConnectionState, string> = {
  connected: "bg-cs-primary",
  reconnecting: "bg-cs-tension",
  connecting: "bg-cs-tension",
  disconnected: "bg-cs-rose",
};

interface PoetHeaderProps {
  sessionMode: SessionMode;
  supervisionMode: SupervisionMode;
  connectionState: PoetConnectionState;
  onSessionMode: (mode: SessionMode) => void;
  onSupervisionMode: (mode: SupervisionMode) => void;
}

export function PoetHeader({
  sessionMode,
  supervisionMode,
  connectionState,
  onSessionMode,
  onSupervisionMode,
}: PoetHeaderProps) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-cs-hairline px-3">
      <div className="flex flex-col gap-1">
        <Toggle
          options={[
            { id: "LIVE", label: "Live" },
            { id: "EDIT", label: "Edit" },
            { id: "BATCH", label: "Batch" },
            { id: "EXPERIMENTAL", label: "Exp" },
          ]}
          value={sessionMode}
          onChange={onSessionMode}
        />
        <Toggle
          options={[
            { id: "AUTOMATIC", label: "Auto" },
            { id: "SUPERVISED", label: "Supervised" },
            { id: "INTERACTIVE", label: "Interactive" },
          ]}
          value={supervisionMode}
          onChange={onSupervisionMode}
        />
      </div>
      <span className={`h-1.5 w-1.5 rounded-full ${CONNECTION_COLOR[connectionState]}`} title={connectionState} />
    </div>
  );
}
