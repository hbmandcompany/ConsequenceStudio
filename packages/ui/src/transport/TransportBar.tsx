import { useState } from "react";
import type { ServiceConnectionStatus } from "../status/BackendStatusIndicator.js";
import { BackendStatusIndicator } from "../status/BackendStatusIndicator.js";
import { StakingTierBadge } from "../status/StakingTierBadge.js";
import { PlayheadPosition } from "./PlayheadPosition.js";
import { TempoControl } from "./TempoControl.js";
import { TimeSignatureControl } from "./TimeSignatureControl.js";
import { TransportButton } from "./TransportButton.js";
import { tokens } from "../design-system/tokens.js";

export interface TransportBarProps {
  sessionName: string;
  isPlaying: boolean;
  isRecording: boolean;
  loopEnabled: boolean;
  positionTicks: number;
  timeSignature: [number, number];
  tempo: number;
  cpuPercent: number;
  memoryPercent: number;
  connections: Array<{ label: string; status: ServiceConnectionStatus }>;
  participantCount: number;
  stakingTier: number;
  stakingTierName: string;
  onSessionNameChange: (name: string) => void;
  onTogglePlay: () => void;
  onToggleRecord: () => void;
  onToggleLoop: () => void;
  onSeekToStart: () => void;
  onTempoChange: (tempo: number) => void;
  onTimeSignatureChange: (ts: [number, number]) => void;
  onCommandPalette: () => void;
  onFloppydiskBrowser: () => void;
}

export function TransportBar({
  sessionName,
  isPlaying,
  isRecording,
  loopEnabled,
  positionTicks,
  timeSignature,
  tempo,
  cpuPercent,
  memoryPercent,
  connections,
  participantCount,
  stakingTier,
  stakingTierName,
  onSessionNameChange,
  onTogglePlay,
  onToggleRecord,
  onToggleLoop,
  onSeekToStart,
  onTempoChange,
  onTimeSignatureChange,
  onCommandPalette,
  onFloppydiskBrowser,
}: TransportBarProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(sessionName);

  return (
    <header
      className="flex shrink-0 items-center gap-3 px-3"
      style={{
        height: tokens.spacing.transportBarHeight,
        backgroundColor: tokens.colors.background.surface,
        borderBottom: `1px solid ${tokens.colors.border.hairline}`,
        fontFamily: tokens.typography.fontFamily.ui,
      }}
    >
      <div
        className="flex items-center justify-center font-semibold"
        style={{
          width: 20,
          height: 20,
          fontSize: 10,
          color: tokens.colors.text.accent,
          border: `1px solid ${tokens.colors.border.standard}`,
          borderRadius: tokens.borderRadius.xs,
        }}
      >
        H
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: tokens.colors.border.hairline }} />

      {editingName ? (
        <input
          autoFocus
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => {
            onSessionNameChange(nameDraft);
            setEditingName(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSessionNameChange(nameDraft);
              setEditingName(false);
            }
          }}
          style={{
            fontSize: tokens.typography.fontSize.panelTitle,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.text.primary,
            background: "transparent",
            border: `1px solid ${tokens.colors.border.active}`,
            borderRadius: tokens.borderRadius.xs,
            padding: "2px 6px",
            minWidth: 160,
          }}
        />
      ) : (
        <button
          type="button"
          onDoubleClick={() => {
            setNameDraft(sessionName);
            setEditingName(true);
          }}
          style={{
            fontSize: tokens.typography.fontSize.panelTitle,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.text.primary,
            background: "transparent",
            border: "none",
            cursor: "text",
            padding: "2px 0",
          }}
        >
          {sessionName}
        </button>
      )}

      <div className="mx-auto flex items-center gap-1.5">
        <TransportButton onClick={onSeekToStart} title="Rewind to start">
          ⏮
        </TransportButton>
        <TransportButton title="Previous marker">⏪</TransportButton>
        <TransportButton
          variant="record"
          active={isRecording}
          onClick={onToggleRecord}
          title="Record"
        >
          ●
        </TransportButton>
        <TransportButton active={isPlaying} onClick={onTogglePlay} title="Play/Pause">
          {isPlaying ? "⏸" : "▶"}
        </TransportButton>
        <TransportButton title="Next marker">⏩</TransportButton>
        <TransportButton active={loopEnabled} onClick={onToggleLoop} title="Cycle">
          ↻
        </TransportButton>
      </div>

      <PlayheadPosition positionTicks={positionTicks} timeSignature={timeSignature} />
      <TempoControl tempo={tempo} onChange={onTempoChange} />
      <TimeSignatureControl timeSignature={timeSignature} onChange={onTimeSignatureChange} />

      <span
        style={{
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.text.muted,
          fontFamily: tokens.typography.fontFamily.mono,
        }}
      >
        CPU {cpuPercent}% · MEM {memoryPercent}%
      </span>

      <div className="flex items-center gap-2">
        {connections.map((c) => (
          <BackendStatusIndicator key={c.label} label={c.label} status={c.status} />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span style={{ fontSize: tokens.typography.fontSize.compact, color: tokens.colors.text.secondary }}>
          {participantCount} online
        </span>
        <StakingTierBadge tier={stakingTier} tierName={stakingTierName} />
        <button
          type="button"
          onClick={onFloppydiskBrowser}
          title="Floppydisk browser"
          style={{
            fontSize: tokens.typography.fontSize.compact,
            color: tokens.colors.text.secondary,
            border: `1px solid ${tokens.colors.border.standard}`,
            borderRadius: tokens.borderRadius.sm,
            padding: "4px 8px",
            background: tokens.colors.background.elevated,
            cursor: "pointer",
          }}
        >
          Disk
        </button>
        <button
          type="button"
          onClick={onCommandPalette}
          style={{
            fontSize: tokens.typography.fontSize.compact,
            color: tokens.colors.text.secondary,
            border: `1px solid ${tokens.colors.border.standard}`,
            borderRadius: tokens.borderRadius.sm,
            padding: "4px 8px",
            background: tokens.colors.background.elevated,
            cursor: "pointer",
          }}
        >
          ⌘K
        </button>
      </div>
    </header>
  );
}
