import { jsx } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
function Loader() {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "center",
        padding: designTokens.spacing.xl
      },
      children: /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            width: "2rem",
            height: "2rem",
            border: `3px solid ${designTokens.colors.border}`,
            borderTopColor: designTokens.colors.primary,
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }
        }
      )
    }
  );
}
export {
  Loader
};
