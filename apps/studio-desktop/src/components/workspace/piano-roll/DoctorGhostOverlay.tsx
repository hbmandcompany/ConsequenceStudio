import { pixelsPerTick, pitchToY, tickToX } from "@consequence/audio";
import { useDoctorStore, usePianoRollStore, useSessionStore, previewedSuggestions } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

const DOCTOR_VIOLET = tokens.colors.accent.doctor;

interface DoctorGhostOverlayProps {
  onAccept: (suggestionId: string) => void;
  onReject: (suggestionId: string) => void;
}

export function DoctorGhostOverlay({ onAccept, onReject }: DoctorGhostOverlayProps) {
  const suggestions = useDoctorStore((s) => previewedSuggestions(s));
  const popoverId = useDoctorStore((s) => s.popoverSuggestionId);
  const setPopoverSuggestionId = useDoctorStore((s) => s.setPopoverSuggestionId);
  const scrollX = usePianoRollStore((s) => s.scrollX);
  const scrollY = usePianoRollStore((s) => s.scrollY);
  const pixelsPerBar = usePianoRollStore((s) => s.pixelsPerBar);
  const rowHeight = usePianoRollStore((s) => s.rowHeight);
  const timeSignature = useSessionStore((s) => s.timeSignature);

  const popoverSuggestion = suggestions.find((s) => s.id === popoverId) ?? null;

  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        {suggestions.map((suggestion) =>
          suggestion.ghost_notes.map((ghost, index) => {
            const x = tickToX(ghost.tick, pixelsPerBar, timeSignature, scrollX);
            const y = pitchToY(ghost.pitch, rowHeight, scrollY);
            const w = Math.max(3, ghost.duration * pixelsPerTick(pixelsPerBar, timeSignature));
            const isFirst = index === 0;
            return (
              <div
                key={`${suggestion.id}-${index}`}
                className="absolute rounded-sm"
                style={{
                  left: x,
                  top: y,
                  width: w,
                  height: rowHeight - 2,
                  backgroundColor: "rgba(90,58,122,0.4)",
                  border: `1px dashed ${DOCTOR_VIOLET}`,
                }}
              >
                {isFirst && (
                  <button
                    type="button"
                    className="pointer-events-auto absolute -left-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: DOCTOR_VIOLET,
                      color: tokens.colors.text.accent,
                      fontSize: 10,
                      border: `1px solid ${tokens.colors.border.standard}`,
                      cursor: "pointer",
                    }}
                    title="Doctor suggestion"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopoverSuggestionId(
                        popoverId === suggestion.id ? null : suggestion.id,
                      );
                    }}
                  >
                    ✚
                  </button>
                )}
              </div>
            );
          }),
        )}
      </div>

      {popoverSuggestion && (
        <div
          className="absolute z-20 max-w-xs rounded p-3 shadow-lg"
          style={{
            left: 12,
            top: 12,
            backgroundColor: tokens.colors.background.modal,
            border: `1px solid ${tokens.colors.border.standard}`,
            color: tokens.colors.text.secondary,
            fontSize: tokens.typography.fontSize.compact,
          }}
        >
          <div
            className="mb-2"
            style={{ color: tokens.colors.text.accent, fontWeight: tokens.typography.fontWeight.semibold }}
          >
            {popoverSuggestion.headline}
          </div>
          <p className="mb-3" style={{ color: tokens.colors.text.secondary }}>
            {popoverSuggestion.explanation}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded px-2 py-1"
              style={{
                backgroundColor: tokens.colors.accent.stable,
                color: tokens.colors.text.accent,
                fontSize: tokens.typography.fontSize.compact,
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => onAccept(popoverSuggestion.id)}
            >
              Accept
            </button>
            <button
              type="button"
              className="rounded px-2 py-1"
              style={{
                backgroundColor: tokens.colors.background.elevated,
                color: tokens.colors.text.secondary,
                fontSize: tokens.typography.fontSize.compact,
                border: `1px solid ${tokens.colors.border.standard}`,
                cursor: "pointer",
              }}
              onClick={() => onReject(popoverSuggestion.id)}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </>
  );
}
