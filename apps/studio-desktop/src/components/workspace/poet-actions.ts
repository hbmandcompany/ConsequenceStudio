import type { GenerationTarget, SupervisionAction, SupervisionActionType } from "@consequence/stream";
import {
  buildIntentEnvelope,
  buildSupervisionEnvelope,
  publishEcosystemEvent,
} from "@consequence/stream";
import {
  buildIntentSignalFromStore,
  getMusicalContextForGeneration,
  usePoetStore,
  useWorkspaceStore,
} from "@consequence/state";
import { getWorkspaceStream } from "../../stream/workspace-stream.js";

function poetClient() {
  return getWorkspaceStream()?.poet ?? null;
}

function publishAuditForIntent(intent: ReturnType<typeof buildIntentSignalFromStore> & { musical_context: ReturnType<typeof getMusicalContextForGeneration> }) {
  const stream = getWorkspaceStream();
  publishEcosystemEvent(stream, buildIntentEnvelope(intent));
}

function publishAuditForSupervision(action: SupervisionAction) {
  const stream = getWorkspaceStream();
  publishEcosystemEvent(stream, buildSupervisionEnvelope(action));
}

function dispatchSupervision(actionType: SupervisionActionType, partial?: Partial<SupervisionAction>): void {
  const state = usePoetStore.getState();
  const generationId = state.current_generation_event?.generation_id ?? state.pending_generation?.generation_id ?? "gen-local";
  const action: SupervisionAction = {
    action_id: `action-${Date.now()}`,
    generation_id: generationId,
    session_id: state.current_session?.session_id ?? "studio-session-1",
    user_id: state.current_session?.user_id ?? "local-user",
    timestamp_ms: Date.now(),
    action_type: actionType,
    ...partial,
  };
  poetClient()?.sendSupervisionAction(action);
  publishAuditForSupervision(action);
  usePoetStore.getState().applySupervisionAction(action);
}

export function generatePoetTarget(target: GenerationTarget): void {
  const intent = buildIntentSignalFromStore(target);
  const musical_context = getMusicalContextForGeneration();
  const fullIntent = { ...intent, musical_context };
  usePoetStore.getState().beginGeneration(intent.intent_id, target);
  poetClient()?.sendGenerationRequest(fullIntent);
  publishAuditForIntent(fullIntent);
}

export const poetPanelActions = {
  onGenerate: generatePoetTarget,
  onAcceptLine: (lineIndex: number) => dispatchSupervision("ACCEPT_LINE", { target_line_index: lineIndex }),
  onRejectLine: (lineIndex: number) => dispatchSupervision("REJECT_LINE", { target_line_index: lineIndex }),
  onEditLine: (lineIndex: number, text: string) =>
    dispatchSupervision("EDIT_LINE", { target_line_index: lineIndex, edited_text: text }),
  onAcceptAll: () => dispatchSupervision("ACCEPT_SEGMENT"),
  onRejectAll: () => dispatchSupervision("REJECT_SEGMENT"),
  onLockConstraints: () => {
    const constraints = usePoetStore.getState().constraint_set;
    dispatchSupervision("LOCK_CONSTRAINT", { constraint_lock: constraints });
  },
  onBranchCreate: () => {
    const branchId = `branch-${Date.now()}`;
    dispatchSupervision("BRANCH_CREATE", { branch_id: branchId });
  },
  onBranchSelect: (branchId: string) => dispatchSupervision("BRANCH_SELECT", { branch_id: branchId }),
  onRegenerate: () => dispatchSupervision("REGENERATE_SEGMENT"),
};

export function openPoetConstraints(): void {
  usePoetStore.getState().setConstraintsSectionOpen(true);
  useWorkspaceStore.getState().focusAssistant("poet");
}

export function togglePoetPanelTab(): void {
  const { rightPanelOpen, rightPanelView, setRightPanelOpen, focusAssistant } =
    useWorkspaceStore.getState();
  if (rightPanelOpen && rightPanelView === "assistant") {
    setRightPanelOpen(false);
  } else {
    focusAssistant("poet");
  }
}
