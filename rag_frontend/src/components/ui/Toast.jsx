import { jsx, jsxs } from "react/jsx-runtime";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import { X } from "lucide-react";
import { designTokens } from "@/theme/tokens";
const ToastContext = createContext(null);
const toneStyles = {
  info: {
    borderColor: designTokens.colors.info,
    background: `${designTokens.colors.info}22`
  },
  success: {
    borderColor: designTokens.colors.success,
    background: `${designTokens.colors.success}22`
  },
  warning: {
    borderColor: designTokens.colors.warning,
    background: `${designTokens.colors.warning}22`
  },
  danger: {
    borderColor: designTokens.colors.danger,
    background: `${designTokens.colors.danger}22`
  }
};
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const showToast = useCallback(
    (message, tone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => removeToast(id), 3200);
    },
    [removeToast]
  );
  const value = useMemo(() => ({ showToast }), [showToast]);
  return /* @__PURE__ */ jsxs(ToastContext.Provider, { value, children: [
    children,
    /* @__PURE__ */ jsx(
      "div",
      {
        "aria-live": "polite",
        style: {
          position: "fixed",
          top: designTokens.spacing.lg,
          right: designTokens.spacing.lg,
          zIndex: 9999,
          display: "grid",
          gap: designTokens.spacing.sm,
          width: "min(24rem, calc(100vw - 2rem))",
          pointerEvents: "none"
        },
        children: toasts.map((toast) => /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: designTokens.spacing.md,
              padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
              borderRadius: designTokens.radii.md,
              border: `1px solid ${toneStyles[toast.tone].borderColor}`,
              background: toneStyles[toast.tone].background,
              color: designTokens.colors.text,
              boxShadow: designTokens.shadow.sm,
              pointerEvents: "auto"
            },
            children: [
              /* @__PURE__ */ jsx("span", { style: { fontWeight: 600 }, children: toast.message }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeToast(toast.id),
                  "aria-label": "Dismiss notification",
                  style: {
                    border: "none",
                    background: "transparent",
                    color: designTokens.colors.textMuted,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center"
                  },
                  children: /* @__PURE__ */ jsx(X, { size: 16 })
                }
              )
            ]
          },
          toast.id
        ))
      }
    )
  ] });
}
function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
export {
  ToastProvider,
  useToast
};
