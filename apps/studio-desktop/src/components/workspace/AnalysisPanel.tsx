import { useTheoryStore } from "@consequence/state";
import { loadStreamConfig } from "@consequence/stream";
import { tokens } from "@consequence/ui/design-system";
import {
  AnimatedBar,
  CircleOfFifths,
  ContourSparkline,
  GrooveGrid,
  MetricRow,
  ModulationTimeline,
  MotifPreview,
  SectionHeader,
} from "./analysis-panel-widgets";

export function AnalysisPanel() {
  const panel = useTheoryStore((s) => s.analysisPanel);
  const status = useTheoryStore((s) => s.connectionStatus);
  const sessionId = useTheoryStore((s) => s.sessionId);
  const engineVersion = useTheoryStore((s) => s.engineVersion);
  const lastTick = useTheoryStore((s) => s.lastTick);

  if (!panel) {
    const theoryUrl = loadStreamConfig().theoryEngineHttpUrl;
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center"
        style={{ color: tokens.colors.text.muted, fontSize: tokens.typography.fontSize.compact }}
      >
        <span>CMTE Analysis</span>
        <span>Status: {status}</span>
        {theoryUrl ? <span className="max-w-xs font-mono text-xs">{theoryUrl}</span> : null}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-auto p-3"
      style={{
        backgroundColor: tokens.colors.background.surface,
        fontSize: tokens.typography.fontSize.compact,
        color: tokens.colors.text.secondary,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span style={{ color: tokens.colors.text.accent, fontWeight: tokens.typography.fontWeight.semibold }}>
          {panel.harmonic.chord ?? "—"} · {panel.harmonic.roman_numeral}
        </span>
        <span className="font-mono" style={{ color: tokens.colors.text.muted }}>
          tick {lastTick}
        </span>
      </div>
      <div className="mb-2" style={{ color: tokens.colors.text.muted, fontSize: 11 }}>
        {status} · v{engineVersion ?? "?"} · {sessionId?.slice(0, 8) ?? "—"}
      </div>

      <SectionHeader>Harmonic</SectionHeader>
      <MetricRow label="Chord" value={panel.harmonic.chord ?? "—"} />
      <MetricRow label="Roman numeral" value={panel.harmonic.roman_numeral} />
      <MetricRow label="Function" value={panel.harmonic.chord_function} />
      <div className="mb-1 flex items-center justify-between gap-2">
        <span style={{ color: tokens.colors.text.muted, fontSize: 11 }}>Tension</span>
        <span className="font-mono" style={{ fontSize: 11 }}>
          {(panel.harmonic.tension * 100).toFixed(0)}%
        </span>
      </div>
      <AnimatedBar value={panel.harmonic.tension} color={tokens.colors.accent.tension} />
      <div className="mt-2 mb-2 flex items-center gap-3">
        <CircleOfFifths activePitchClasses={panel.harmonic.pitch_class_set} />
        <div style={{ color: tokens.colors.text.muted, fontSize: 10 }}>
          Pitch classes: {panel.harmonic.pitch_class_set.join(", ")}
        </div>
      </div>

      <SectionHeader>Melodic</SectionHeader>
      <MotifPreview motif={panel.melodic.motif} />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span style={{ color: tokens.colors.text.muted, fontSize: 11 }}>Contour</span>
        <span style={{ fontSize: 11, textTransform: "capitalize" }}>{panel.melodic.contour}</span>
      </div>
      <ContourSparkline values={panel.melodic.contour_sparkline} />
      <MetricRow label="Density" value={panel.melodic.density.toFixed(1)} />

      <SectionHeader>Rhythmic</SectionHeader>
      <GrooveGrid cells={panel.rhythmic.groove_vector} />
      <div className="mt-2 mb-1 flex items-center justify-between gap-2">
        <span style={{ color: tokens.colors.text.muted, fontSize: 11 }}>Syncopation</span>
        <span className="font-mono" style={{ fontSize: 11 }}>
          {(panel.rhythmic.syncopation * 100).toFixed(0)}%
        </span>
      </div>
      <AnimatedBar value={panel.rhythmic.syncopation} color={tokens.colors.track.amber} />
      <MetricRow label="Timing variance" value={`${panel.rhythmic.timing_variance_ms} ms`} />

      <SectionHeader>Tonal</SectionHeader>
      <MetricRow label="Key" value={`${panel.tonal.key} ${panel.tonal.mode}`} />
      <div className="mb-1 flex items-center justify-between gap-2">
        <span style={{ color: tokens.colors.text.muted, fontSize: 11 }}>Confidence</span>
        <span className="font-mono" style={{ fontSize: 11 }}>
          {(panel.tonal.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <AnimatedBar value={panel.tonal.confidence} color={tokens.colors.accent.stable} />
      <MetricRow label="Ambiguity" value={(panel.tonal.ambiguity * 100).toFixed(0) + "%"} />
      <div className="mt-2">
        <div style={{ color: tokens.colors.text.muted, fontSize: 11, marginBottom: 4 }}>
          Modulation history
        </div>
        <ModulationTimeline entries={panel.tonal.modulation_history} />
      </div>

      <SectionHeader>Structural</SectionHeader>
      <MetricRow
        label="Phrase length"
        value={
          panel.structural.phrase_length_beats != null
            ? `${panel.structural.phrase_length_beats} beats`
            : "—"
        }
      />
      <div className="mb-1 flex items-center justify-between gap-2">
        <span style={{ color: tokens.colors.text.muted, fontSize: 11 }}>Phrase regularity</span>
        <span className="font-mono" style={{ fontSize: 11 }}>
          {(panel.structural.phrase_regularity * 100).toFixed(0)}%
        </span>
      </div>
      <AnimatedBar value={panel.structural.phrase_regularity} color={tokens.colors.accent.cmte} />
      <div className="mb-1 flex items-center justify-between gap-2">
        <span style={{ color: tokens.colors.text.muted, fontSize: 11 }}>Progression consistency</span>
        <span className="font-mono" style={{ fontSize: 11 }}>
          {(panel.structural.progression_consistency * 100).toFixed(0)}%
        </span>
      </div>
      <AnimatedBar
        value={panel.structural.progression_consistency}
        color={tokens.colors.track.indigo}
      />
    </div>
  );
}
