import type { ReactNode } from "react";
import { designTokens } from "@/theme/tokens";

type AlertProps = {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
};

const toneStyles: Record<
  NonNullable<AlertProps["tone"]>,
  React.CSSProperties
> = {
  info: {
    background: `${designTokens.colors.info}22`,
    borderColor: designTokens.colors.info,
    color: designTokens.colors.text,
  },
  success: {
    background: `${designTokens.colors.success}22`,
    borderColor: designTokens.colors.success,
    color: designTokens.colors.text,
  },
  warning: {
    background: `${designTokens.colors.warning}22`,
    borderColor: designTokens.colors.warning,
    color: designTokens.colors.text,
  },
  danger: {
    background: `${designTokens.colors.danger}22`,
    borderColor: designTokens.colors.danger,
    color: designTokens.colors.text,
  },
};

export function Alert({ children, tone = "info" }: AlertProps) {
  return (
    <div
      style={{
        padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
        borderRadius: designTokens.radii.md,
        border: `1px solid ${toneStyles[tone].borderColor}`,
        background: toneStyles[tone].background,
        color: toneStyles[tone].color,
      }}
    >
      {children}
    </div>
  );
}
