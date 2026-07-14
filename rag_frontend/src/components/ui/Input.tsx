import type { InputHTMLAttributes } from "react";
import { designTokens } from "@/theme/tokens";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, style, ...props }: InputProps) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: designTokens.spacing.xs,
        color: designTokens.colors.textMuted,
        fontSize: designTokens.typography.label,
      }}
    >
      {label ? <span>{label}</span> : null}
      <input
        {...props}
        style={{
          padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
          borderRadius: designTokens.radii.md,
          border: `1px solid ${designTokens.colors.border}`,
          background: designTokens.colors.surfaceAlt,
          color: designTokens.colors.text,
          outline: "none",
          ...style,
        }}
      />
    </label>
  );
}
