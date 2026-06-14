import { useMemo, useState } from "react";
import type { GenerationTarget } from "@consequence/stream";
import { usePoetStore } from "@consequence/state";
import { PoetAcceptedLines } from "./poet/PoetAcceptedLines.js";
import { PoetBackendStatusStrip } from "./poet/PoetBackendStatusStrip.js";
import { PoetBranchSelector } from "./poet/PoetBranchSelector.js";
import { PoetConstraintSection } from "./poet/PoetConstraintSection.js";
import { PoetGenerationControls } from "./poet/PoetGenerationControls.js";
import { PoetHeader } from "./poet/PoetHeader.js";
import { PoetStreamingDisplay } from "./poet/PoetStreamingDisplay.js";

export interface PoetPanelActions {
  onGenerate: (target: GenerationTarget) => void;
  onAcceptLine: (lineIndex: number) => void;
  onRejectLine: (lineIndex: number) => void;
  onEditLine: (lineIndex: number, text: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onLockConstraints: () => void;
  onBranchCreate: () => void;
  onBranchSelect: (branchId: string) => void;
}

export function PoetPanel({ actions }: { actions: PoetPanelActions }) {
  const connectionState = usePoetStore((s) => s.connection_state);
  const sessionMode = usePoetStore((s) => s.session_mode);
  const supervisionMode = usePoetStore((s) => s.supervision_mode);
  const creativeFreedom = usePoetStore((s) => s.creative_freedom);
  const isStreaming = usePoetStore((s) => s.is_streaming);
  const constraintSet = usePoetStore((s) => s.constraint_set);
  const constraintsLocked = usePoetStore((s) => s.constraints_locked);
  const constraintsOpen = usePoetStore((s) => s.constraints_section_open);
  const activeBranchLines = usePoetStore((s) => s.active_branch_lines);
  const currentBranchId = usePoetStore((s) => s.current_branch_id);
  const currentSession = usePoetStore((s) => s.current_session);
  const backendStatus = usePoetStore((s) => s.backend_status);
  const setSessionMode = usePoetStore((s) => s.setSessionMode);
  const setSupervisionMode = usePoetStore((s) => s.setSupervisionMode);
  const setCreativeFreedom = usePoetStore((s) => s.setCreativeFreedom);
  const setConstraintSet = usePoetStore((s) => s.setConstraintSet);
  const setConstraintsSectionOpen = usePoetStore((s) => s.setConstraintsSectionOpen);

  const [target, setTarget] = useState<GenerationTarget>("VERSE");
  const branches = useMemo(
    () => Object.keys(currentSession?.branches ?? (currentBranchId ? { [currentBranchId]: true } : {})),
    [currentSession, currentBranchId],
  );
  const branchLabel = useMemo(() => {
    const index = branches.findIndex((id) => id === currentBranchId);
    return index >= 0 ? `Branch ${String.fromCharCode(65 + index)}` : "Branch A";
  }, [branches, currentBranchId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-cs-surface font-sans">
      <PoetHeader
        sessionMode={sessionMode}
        supervisionMode={supervisionMode}
        connectionState={connectionState}
        onSessionMode={setSessionMode}
        onSupervisionMode={setSupervisionMode}
      />
      <PoetConstraintSection
        open={constraintsOpen}
        locked={constraintsLocked}
        constraints={constraintSet}
        onToggle={() => setConstraintsSectionOpen(!constraintsOpen)}
        onChange={setConstraintSet}
        onLock={actions.onLockConstraints}
      />
      <PoetGenerationControls
        target={target}
        creativeFreedom={creativeFreedom}
        isStreaming={isStreaming}
        onTarget={setTarget}
        onCreativeFreedom={setCreativeFreedom}
        onGenerate={() => actions.onGenerate(target)}
      />
      <PoetStreamingDisplay
        showSupervision={supervisionMode !== "AUTOMATIC"}
        onAcceptLine={actions.onAcceptLine}
        onRejectLine={actions.onRejectLine}
        onEditLine={actions.onEditLine}
        onAcceptAll={actions.onAcceptAll}
        onRejectAll={actions.onRejectAll}
      />
      <PoetBranchSelector branches={branches} activeBranchId={currentBranchId} onSelect={actions.onBranchSelect} />
      <PoetAcceptedLines branchLabel={branchLabel} lines={activeBranchLines} onBranchCreate={actions.onBranchCreate} />
      <PoetBackendStatusStrip status={backendStatus} />
    </div>
  );
}
