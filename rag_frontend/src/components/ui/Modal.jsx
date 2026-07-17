import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { designTokens } from "@/theme/tokens";
function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(7, 17, 31, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: designTokens.spacing.xl,
          zIndex: 1e3
        },
        onClick: onClose,
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              width: "min(560px, 100%)",
              background: designTokens.colors.surface,
              border: `1px solid ${designTokens.colors.border}`,
              borderRadius: designTokens.radii.lg,
              boxShadow: designTokens.shadow.lg,
              padding: designTokens.spacing.xl
            },
            onClick: (event) => event.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: designTokens.spacing.lg
                  },
                  children: [
                    /* @__PURE__ */ jsx("h3", { style: { margin: 0 }, children: title }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: onClose,
                        style: {
                          background: "transparent",
                          border: "none",
                          color: designTokens.colors.textMuted,
                          cursor: "pointer"
                        },
                        children: "\u2715"
                      }
                    )
                  ]
                }
              ),
              children
            ]
          }
        )
      }
    ),
    document.body
  );
}
export {
  Modal
};
