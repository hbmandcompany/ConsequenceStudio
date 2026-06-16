import type { CSSProperties, ReactNode } from "react";
import { tokens } from "../design-system/tokens.js";

export interface CardProps {
  title?: ReactNode;
  /** Right-aligned actions rendered in the card header. */
  actions?: ReactNode;
  /** Subtitle / supporting text shown under the title. */
  subtitle?: ReactNode;
  /** Leading element (icon, status dot) shown before the title. */
  leading?: ReactNode;
  /** Remove inner body padding (useful for canvases / lists). */
  flush?: boolean;
  /** Raise the card with a stronger shadow + border. */
  elevated?: boolean;
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children?: ReactNode;
}

/**
 * Figma-style surface card with an optional header. Used as the primary
 * structural element across the workspace to break the UI into discrete panels.
 */
export function Card({
  title,
  actions,
  subtitle,
  leading,
  flush = false,
  elevated = false,
  className,
  style,
  bodyStyle,
  children,
}: CardProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        backgroundColor: tokens.colors.background.surface,
        border: `1px solid ${elevated ? tokens.colors.border.standard : tokens.colors.border.hairline}`,
        borderRadius: tokens.borderRadius.lg,
        boxShadow: elevated
          ? "0 8px 28px rgba(0, 0, 0, 0.36)"
          : "0 1px 2px rgba(0, 0, 0, 0.22)",
        overflow: "hidden",
        ...style,
      }}
    >
      {(title || actions) && (
        <div
          className="flex shrink-0 items-center gap-2"
          style={{
            height: 38,
            padding: "0 12px",
            borderBottom: `1px solid ${tokens.colors.border.hairline}`,
            background: tokens.colors.background.elevated,
          }}
        >
          {leading}
          <div className="flex min-w-0 flex-col">
            {title && (
              <span
                style={{
                  fontSize: tokens.typography.fontSize.compact,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.text.primary,
                  fontFamily: tokens.typography.fontFamily.ui,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </span>
            )}
            {subtitle && (
              <span
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.text.muted,
                  fontFamily: tokens.typography.fontFamily.ui,
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
          {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{
          padding: flush ? 0 : 12,
          overflow: "hidden",
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
