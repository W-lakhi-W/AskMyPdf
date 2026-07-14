import type { SelectHTMLAttributes } from "react";
import { designTokens } from "@/theme/tokens";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Array<{ value: string; label: string }>;
};

export function Select({ label, options, style, ...props }: SelectProps) {
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
      <select
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
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
