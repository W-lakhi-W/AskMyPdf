import { jsx, jsxs } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
function Input({ label, style, ...props }) {
  return /* @__PURE__ */ jsxs(
    "label",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: designTokens.spacing.xs,
        color: designTokens.colors.textMuted,
        fontSize: designTokens.typography.label
      },
      children: [
        label ? /* @__PURE__ */ jsx("span", { children: label }) : null,
        /* @__PURE__ */ jsx(
          "input",
          {
            ...props,
            style: {
              padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
              borderRadius: designTokens.radii.md,
              border: `1px solid ${designTokens.colors.border}`,
              background: designTokens.colors.surfaceAlt,
              color: designTokens.colors.text,
              outline: "none",
              ...style
            }
          }
        )
      ]
    }
  );
}
export {
  Input
};
