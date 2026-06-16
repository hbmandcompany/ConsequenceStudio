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
  assistantOpen: boolean;
  profileInitial: string;
  onSessionNameChange: (name: string) => void;
  onTogglePlay: () => void;
  onToggleRecord: () => void;
  onToggleLoop: () => void;
  onSeekToStart: () => void;
  onPreviousMarker: () => void;
  onNextMarker: () => void;
  onTempoChange: (tempo: number) => void;
  onTimeSignatureChange: (ts: [number, number]) => void;
  onOpenCollab: () => void;
  onToggleAssistant: () => void;
}

function ConferenceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2.5" y="6.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 10.2 L20.5 7 V17 L14.5 13.8 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
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
  assistantOpen,
  profileInitial,
  onSessionNameChange,
  onTogglePlay,
  onToggleRecord,
  onToggleLoop,
  onSeekToStart,
  onPreviousMarker,
  onNextMarker,
  onTempoChange,
  onTimeSignatureChange,
  onOpenCollab,
  onToggleAssistant,
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
          onClick={() => {
            setNameDraft(sessionName);
            setEditingName(true);
          }}
          title="Click to rename"
          style={{
            fontSize: tokens.typography.fontSize.panelTitle,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.text.primary,
            background: "transparent",
            border: "none",
            cursor: "text",
            padding: "2px 4px",
            borderRadius: tokens.borderRadius.xs,
          }}
        >
          {sessionName}
        </button>
      )}

      <div className="mx-auto flex items-center gap-1.5">
        <TransportButton onClick={onSeekToStart} title="Rewind to start">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <rect x="0" y="1" width="1.5" height="10" fill="currentColor" rx="0.5"/>
            <path d="M10.5 1.5 L3 6 L10.5 10.5 Z" fill="currentColor"/>
          </svg>
        </TransportButton>
        <TransportButton onClick={onPreviousMarker} title="Previous marker">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <rect x="0.5" y="1" width="1.5" height="10" fill="currentColor" rx="0.5"/>
            <path d="M11 1.5 L4.5 6 L11 10.5 Z" fill="currentColor"/>
          </svg>
        </TransportButton>
        <TransportButton
          variant="record"
          active={isRecording}
          onClick={onToggleRecord}
          title="Record"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
            <circle cx="4" cy="4" r="4" fill="currentColor"/>
          </svg>
        </TransportButton>
        <TransportButton active={isPlaying} onClick={onTogglePlay} title="Play/Pause">
          {isPlaying ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
              <rect x="0" y="0" width="3.5" height="12" fill="currentColor" rx="0.5"/>
              <rect x="6.5" y="0" width="3.5" height="12" fill="currentColor" rx="0.5"/>
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
              <path d="M0.5 0.5 L9.5 6 L0.5 11.5 Z" fill="currentColor"/>
            </svg>
          )}
        </TransportButton>
        <TransportButton onClick={onNextMarker} title="Next marker">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <rect x="10" y="1" width="1.5" height="10" fill="currentColor" rx="0.5"/>
            <path d="M1 1.5 L7.5 6 L1 10.5 Z" fill="currentColor"/>
          </svg>
        </TransportButton>
        <TransportButton active={loopEnabled} onClick={onToggleLoop} title="Cycle / Loop">
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
            <path d="M1 7.5 C1 4.5 3 2.5 6 2.5 L10 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M8 0.5 L10.5 2.5 L8 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M13 3.5 C13 6.5 11 8.5 8 8.5 L4 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M6 10.5 L3.5 8.5 L6 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
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
        <StakingTierBadge tier={stakingTier} tierName={stakingTierName} />

        <button
          type="button"
          onClick={onOpenCollab}
          title="Collaboration"
          className="flex items-center gap-1.5"
          style={{
            color: tokens.colors.text.secondary,
            border: `1px solid ${tokens.colors.border.standard}`,
            borderRadius: tokens.borderRadius.sm,
            padding: "4px 8px",
            background: tokens.colors.background.elevated,
            cursor: "pointer",
          }}
        >
          <ConferenceIcon />
          <span style={{ fontSize: tokens.typography.fontSize.compact }}>{participantCount}</span>
        </button>

        <button
          type="button"
          onClick={onToggleAssistant}
          title="Profile · Assistant"
          aria-pressed={assistantOpen}
          style={{
            width: 30,
            height: 30,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: tokens.typography.fontSize.compact,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: assistantOpen ? tokens.colors.background.canvas : tokens.colors.text.secondary,
            borderRadius: "50%",
            border: `1px solid ${assistantOpen ? tokens.colors.text.accent : tokens.colors.border.standard}`,
            background: assistantOpen ? tokens.colors.text.accent : tokens.colors.background.elevated,
            cursor: "pointer",
          }}
        >
          {profileInitial}
        </button>
      </div>
    </header>
  );
}
