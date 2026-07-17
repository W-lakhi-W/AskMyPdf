import { jsx, jsxs } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
function Card({ title, description, children, actions }) {
  return /* @__PURE__ */ jsxs(
    "section",
    {
      style: {
        background: designTokens.colors.surface,
        border: `1px solid ${designTokens.colors.border}`,
        borderRadius: designTokens.radii.lg,
        boxShadow: designTokens.shadow.sm,
        padding: designTokens.spacing.xl
      },
      children: [
        (title || description || actions) && /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: designTokens.spacing.md,
              marginBottom: designTokens.spacing.lg
            },
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                title ? /* @__PURE__ */ jsx(
                  "h3",
                  {
                    style: { margin: 0, fontSize: designTokens.typography.heading },
                    children: title
                  }
                ) : null,
                description ? /* @__PURE__ */ jsx(
                  "p",
                  {
                    style: {
                      margin: designTokens.spacing.xs + " 0 0",
                      color: designTokens.colors.textMuted
                    },
                    children: description
                  }
                ) : null
              ] }),
              actions ? /* @__PURE__ */ jsx("div", { children: actions }) : null
            ]
          }
        ),
        children
      ]
    }
  );
}
export {
  Card
};
