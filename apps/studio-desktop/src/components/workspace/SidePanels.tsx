import { useCallback, useRef, type ReactNode } from "react";
import type { RightPanelTab } from "@consequence/state";
import { useWorkspaceStore } from "@consequence/state";
import { ResizeHandle } from "@consequence/ui";
import { tokens } from "@consequence/ui/design-system";
import { TrackList } from "./TrackList";
import { InspectorPanel } from "./InspectorPanel";
import { DoctorPanel } from "./DoctorPanel";
import { AnalysisPanel } from "./AnalysisPanel";
import { LedgerPanel } from "./LedgerPanel";
import { CollaborationPanel } from "./CollaborationPanel";

import { PoetPanel } from "@consequence/ui";
import { usePoetStore } from "@consequence/state";
import { poetPanelActions } from "./poet-actions";

const TABS: { id: RightPanelTab; label: string }[] = [
  { id: "doctor", label: "Doctor" },
  { id: "analysis", label: "Analysis" },
  { id: "ledger", label: "Ledger" },
  { id: "collab", label: "Collab" },
  { id: "poet", label: "Poet" },
];

function LeftPanelSplit() {
  const trackListRatio = useWorkspaceStore((s) => s.trackListRatio);
  const setTrackListRatio = useWorkspaceStore((s) => s.setTrackListRatio);
  const startRatio = useRef(trackListRatio);

  const onResizeDelta = useCallback(
    (delta: number) => {
      const container = document.getElementById("left-panel-split");
      if (!container) return;
      const total = container.clientHeight;
      const next = Math.min(0.85, Math.max(0.35, startRatio.current + delta / total));
      setTrackListRatio(next);
    },
    [setTrackListRatio],
  );

  return (
    <div id="left-panel-split" className="flex min-h-0 flex-1 flex-col">
      <div style={{ flex: trackListRatio, minHeight: 0, overflow: "hidden" }}>
        <TrackList />
      </div>
      <div onMouseDown={() => { startRatio.current = trackListRatio; }}>
        <ResizeHandle orientation="horizontal" onResizeDelta={onResizeDelta} />
      </div>
      <div style={{ flex: 1 - trackListRatio, minHeight: 0, overflow: "hidden" }}>
        <InspectorPanel />
      </div>
    </div>
  );
}

function RightPanelContent() {
  const tab = useWorkspaceStore((s) => s.activeRightTab);

  const content: Record<RightPanelTab, ReactNode> = {
    doctor: <DoctorPanel />,
    analysis: <AnalysisPanel />,
    ledger: <LedgerPanel />,
    collab: <CollaborationPanel />,
    poet: <PoetPanel actions={poetPanelActions} />,
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ backgroundColor: tokens.colors.background.surface }}
    >
      {typeof content[tab] === "string" ? (
        <div
          className="flex flex-1 items-center justify-center p-4 text-center"
          style={{
            fontSize: tokens.typography.fontSize.compact,
            color: tokens.colors.text.muted,
          }}
        >
          {content[tab]}
        </div>
      ) : (
        content[tab]
      )}
    </div>
  );
}

export function RightPanelTabs() {
  const activeTab = useWorkspaceStore((s) => s.activeRightTab);
  const setActiveRightTab = useWorkspaceStore((s) => s.setActiveRightTab);
  const supervisionPending = usePoetStore((s) => s.supervision_pending);

  return (
    <div
      className="flex shrink-0"
      style={{
        height: tokens.spacing.tabBarHeight,
        borderBottom: `1px solid ${tokens.colors.border.hairline}`,
        backgroundColor: tokens.colors.background.surface,
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveRightTab(tab.id)}
          style={{
            flex: 1,
            fontSize: tokens.typography.fontSize.compact,
            fontWeight: tokens.typography.fontWeight.medium,
            color: activeTab === tab.id ? tokens.colors.text.accent : tokens.colors.text.secondary,
            background: activeTab === tab.id ? tokens.colors.background.elevated : "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          {tab.label}
          {tab.id === "poet" && supervisionPending ? (
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                marginLeft: 4,
                borderRadius: "50%",
                backgroundColor: tokens.colors.track.violet,
              }}
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function LeftPanel() {
  return <LeftPanelSplit />;
}

export function RightPanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <RightPanelTabs />
      <RightPanelContent />
    </div>
  );
}
