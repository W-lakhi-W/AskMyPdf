import { jsx, jsxs } from "react/jsx-runtime";
import { Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { designTokens } from "@/theme/tokens";
function ChatComposer({
  value,
  disabled,
  onChange,
  onSend,
  inputRef
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        position: "sticky",
        bottom: 0,
        background: `${designTokens.colors.surface}f2`,
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${designTokens.colors.border}`,
        padding: `${designTokens.spacing.md} ${designTokens.spacing.xl}`
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: designTokens.spacing.sm,
            minHeight: "3.5rem",
            padding: `${designTokens.spacing.sm} ${designTokens.spacing.sm} ${designTokens.spacing.sm} ${designTokens.spacing.lg}`,
            border: `1px solid ${designTokens.colors.border}`,
            borderRadius: designTokens.radii.md,
            background: designTokens.colors.surfaceAlt,
            boxShadow: designTokens.shadow.sm
          },
          children: [
            /* @__PURE__ */ jsx(
              "textarea",
              {
                ref: inputRef,
                value,
                onChange: (event) => onChange(event.target.value),
                onKeyDown: handleKeyDown,
                placeholder: "Ask anything...",
                rows: 2,
                disabled,
                style: {
                  resize: "none",
                  minHeight: "2.5rem",
                  maxHeight: "8rem",
                  padding: `${designTokens.spacing.sm} 0`,
                  border: 0,
                  background: "transparent",
                  color: designTokens.colors.text,
                  outline: "none",
                  width: "100%",
                  lineHeight: 1.5,
                  overflowY: "auto"
                }
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                onClick: onSend,
                disabled: disabled || !value.trim(),
                "aria-label": "Send message",
                title: "Send message",
                style: {
                  width: "2.75rem",
                  height: "2.75rem",
                  padding: 0,
                  flexShrink: 0,
                  borderRadius: designTokens.radii.sm
                },
                children: disabled ? /* @__PURE__ */ jsx(Loader2, { size: 18 }) : /* @__PURE__ */ jsx(SendHorizontal, { size: 18 })
              }
            )
          ]
        }
      )
    }
  );
}
export {
  ChatComposer
};
