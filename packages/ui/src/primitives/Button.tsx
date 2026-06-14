import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "icon" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  default: "border border-cs-border px-2 py-1 text-cs-secondary hover:text-cs-primary",
  icon: "h-6 w-6 border border-cs-border text-cs-secondary hover:text-cs-primary",
  ghost: "text-cs-secondary hover:text-cs-primary",
};

export function Button({ variant = "default", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-sm bg-cs-elevated text-[12px] ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
