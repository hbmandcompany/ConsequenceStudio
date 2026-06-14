import type { ButtonHTMLAttributes, ReactNode } from "react";
import { tokens } from "../design-system/tokens.js";

interface TransportButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "default" | "record";
  children: ReactNode;
}

export function TransportButton({
  active = false,
  variant = "default",
  children,
  style,
  ...props
}: TransportButtonProps) {
  const isRecord = variant === "record";
  return (
    <button
      type="button"
      {...props}
      style={{
        width: 28,
        height: 28,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: tokens.borderRadius.sm,
        border: `1px solid ${active ? tokens.colors.border.active : tokens.colors.border.standard}`,
        backgroundColor: active
          ? isRecord
            ? tokens.colors.accent.error
            : tokens.colors.background.elevated
          : "transparent",
        color: active && isRecord ? tokens.colors.text.accent : tokens.colors.text.secondary,
        fontFamily: tokens.typography.fontFamily.ui,
        fontSize: tokens.typography.fontSize.compact,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
