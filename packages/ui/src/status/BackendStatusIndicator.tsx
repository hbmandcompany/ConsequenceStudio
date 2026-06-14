import { tokens } from "../design-system/tokens.js";

export type ServiceConnectionStatus = "disconnected" | "connecting" | "connected";

const STATUS_COLORS: Record<ServiceConnectionStatus, string> = {
  connected: tokens.colors.accent.platform,
  connecting: tokens.colors.accent.tension,
  disconnected: tokens.colors.accent.error,
};

interface BackendStatusIndicatorProps {
  label: string;
  status: ServiceConnectionStatus;
}

export function BackendStatusIndicator({ label, status }: BackendStatusIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1" title={`${label}: ${status}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: STATUS_COLORS[status],
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.text.muted,
          fontFamily: tokens.typography.fontFamily.ui,
        }}
      >
        {label}
      </span>
    </span>
  );
}
