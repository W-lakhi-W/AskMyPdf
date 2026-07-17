import { jsx } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
const variantStyles = {
  primary: {
    background: designTokens.colors.primary,
    color: designTokens.colors.text,
    border: "none"
  },
  secondary: {
    background: designTokens.colors.surfaceAlt,
    color: designTokens.colors.text,
    border: `1px solid ${designTokens.colors.border}`
  },
  ghost: {
    background: "transparent",
    color: designTokens.colors.textMuted,
    border: "none"
  },
  danger: {
    background: designTokens.colors.danger,
    color: designTokens.colors.text,
    border: "none"
  }
};
function Button({
  children,
  variant = "primary",
  fullWidth = false,
  style,
  disabled,
  ...props
}) {
  const isDisabled = Boolean(disabled);
  return /* @__PURE__ */ jsx(
    "button",
    {
      ...props,
      disabled: isDisabled,
      style: {
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
        ...style
      },
      children
    }
  );
}
export {
  Button
};
