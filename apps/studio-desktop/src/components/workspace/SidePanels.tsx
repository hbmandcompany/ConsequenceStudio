import { TrackList } from "./TrackList";
import { MixerPanel } from "./MixerPanel";
import { CollaborationPanel } from "./CollaborationPanel";
import { AssistantPanel } from "./AssistantPanel";
import { TrackInstrumentModal } from "./TrackInstrumentModal";
import { useWorkspaceStore, usePoetStore } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

function RightPanelHeader() {
  const view = useWorkspaceStore((s) => s.rightPanelView);
  const setRightPanelView = useWorkspaceStore((s) => s.setRightPanelView);
  const setRightPanelOpen = useWorkspaceStore((s) => s.setRightPanelOpen);
  const supervisionPending = usePoetStore((s) => s.supervision_pending);

  const segments: { id: "assistant" | "collab"; label: string }[] = [
    { id: "assistant", label: "Assistant" },
    { id: "collab", label: "Collab" },
  ];

  return (
    <div
      className="flex shrink-0 items-center gap-2 px-2"
      style={{
        height: tokens.spacing.tabBarHeight,
        borderBottom: `1px solid ${tokens.colors.border.hairline}`,
        background: tokens.colors.background.elevated,
      }}
    >
      <div
        className="flex items-center gap-0.5 rounded-md p-0.5"
        style={{ background: tokens.colors.background.canvas }}
      >
        {segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => setRightPanelView(segment.id)}
            style={{
              padding: "4px 10px",
              borderRadius: tokens.borderRadius.sm,
              border: "none",
              cursor: "pointer",
              fontSize: tokens.typography.fontSize.compact,
              fontWeight: tokens.typography.fontWeight.medium,
              color: view === segment.id ? tokens.colors.text.accent : tokens.colors.text.secondary,
              background: view === segment.id ? tokens.colors.background.surface : "transparent",
            }}
          >
            {segment.label}
            {segment.id === "assistant" && supervisionPending ? (
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
      <button
        type="button"
        title="Close panel"
        onClick={() => setRightPanelOpen(false)}
        className="ml-auto"
        style={{
          width: 24,
          height: 24,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: tokens.borderRadius.sm,
          border: "none",
          background: "transparent",
          color: tokens.colors.text.muted,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export function LeftPanel() {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden" style={{ paddingTop: 6 }}>
          <TrackList />
        </div>
        <MixerPanel />
      </div>
      <TrackInstrumentModal />
    </>
  );
}

export function RightPanel() {
  const view = useWorkspaceStore((s) => s.rightPanelView);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ backgroundColor: tokens.colors.background.surface }}
    >
      <RightPanelHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === "assistant" ? <AssistantPanel /> : <CollaborationPanel />}
      </div>
    </div>
  );
}
