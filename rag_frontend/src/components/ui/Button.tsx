import type { ButtonHTMLAttributes, ReactNode } from "react";
import { designTokens } from "@/theme/tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: designTokens.colors.primary,
    color: designTokens.colors.text,
    border: "none",
  },
  secondary: {
    background: designTokens.colors.surfaceAlt,
    color: designTokens.colors.text,
    border: `1px solid ${designTokens.colors.border}`,
  },
  ghost: {
    background: "transparent",
    color: designTokens.colors.textMuted,
    border: "none",
  },
  danger: {
    background: designTokens.colors.danger,
    color: designTokens.colors.text,
    border: "none",
  },
};

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled);

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        padding: `${designTokens.spacing.sm} ${designTokens.spacing.lg}`,
        borderRadius: designTokens.radii.md,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: designTokens.transitions.default,
        width: fullWidth ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: designTokens.spacing.sm,
        fontWeight: 600,
        opacity: isDisabled ? 0.6 : 1,
        filter: isDisabled ? "saturate(0.6)" : "none",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
