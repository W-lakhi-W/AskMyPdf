import { jsx } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
const toneStyles = {
  info: {
    background: `${designTokens.colors.info}22`,
    borderColor: designTokens.colors.info,
    color: designTokens.colors.text
  },
  success: {
    background: `${designTokens.colors.success}22`,
    borderColor: designTokens.colors.success,
    color: designTokens.colors.text
  },
  warning: {
    background: `${designTokens.colors.warning}22`,
    borderColor: designTokens.colors.warning,
    color: designTokens.colors.text
  },
  danger: {
    background: `${designTokens.colors.danger}22`,
    borderColor: designTokens.colors.danger,
    color: designTokens.colors.text
  }
};
function Alert({ children, tone = "info" }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
        borderRadius: designTokens.radii.md,
        border: `1px solid ${toneStyles[tone].borderColor}`,
        background: toneStyles[tone].background,
        color: toneStyles[tone].color
      },
      children
    }
  );
}
export {
  Alert
};
