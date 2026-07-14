import type { ReactNode } from "react";
import { designTokens } from "@/theme/tokens";

type BadgeProps = {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
};

const toneStyles: Record<
  NonNullable<BadgeProps["tone"]>,
  React.CSSProperties
> = {
  info: {
    background: `${designTokens.colors.info}22`,
    color: designTokens.colors.info,
  },
  success: {
    background: `${designTokens.colors.success}22`,
    color: designTokens.colors.success,
  },
  warning: {
    background: `${designTokens.colors.warning}22`,
    color: designTokens.colors.warning,
  },
  danger: {
    background: `${designTokens.colors.danger}22`,
    color: designTokens.colors.danger,
  },
};

export function Badge({ children, tone = "info" }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${designTokens.spacing.xs} ${designTokens.spacing.sm}`,
        borderRadius: designTokens.radii.pill,
        fontSize: designTokens.typography.label,
        fontWeight: 600,
        ...toneStyles[tone],
      }}
    >
      {children}
    </span>
  );
}
