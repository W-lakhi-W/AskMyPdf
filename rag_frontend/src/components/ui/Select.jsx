import { jsx, jsxs } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
function Select({ label, options, style, ...props }) {
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
          "select",
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
            },
            children: options.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
          }
        )
      ]
    }
  );
}
export {
  Select
};
