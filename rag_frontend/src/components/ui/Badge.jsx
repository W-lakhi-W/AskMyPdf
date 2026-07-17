import { jsx } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
const toneStyles = {
  info: {
    background: `${designTokens.colors.info}22`,
    color: designTokens.colors.info
  },
  success: {
    background: `${designTokens.colors.success}22`,
    color: designTokens.colors.success
  },
  warning: {
    background: `${designTokens.colors.warning}22`,
    color: designTokens.colors.warning
  },
  danger: {
    background: `${designTokens.colors.danger}22`,
    color: designTokens.colors.danger
  }
};
function Badge({ children, tone = "info" }) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        padding: `${designTokens.spacing.xs} ${designTokens.spacing.sm}`,
        borderRadius: designTokens.radii.pill,
        fontSize: designTokens.typography.label,
        fontWeight: 600,
        ...toneStyles[tone]
      },
      children
    }
  );
}
export {
  Badge
};
