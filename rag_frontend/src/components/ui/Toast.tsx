import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { designTokens } from "@/theme/tokens";

type ToastTone = "info" | "success" | "warning" | "danger";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, React.CSSProperties> = {
  info: {
    borderColor: designTokens.colors.info,
    background: `${designTokens.colors.info}22`,
  },
  success: {
    borderColor: designTokens.colors.success,
    background: `${designTokens.colors.success}22`,
  },
  warning: {
    borderColor: designTokens.colors.warning,
    background: `${designTokens.colors.warning}22`,
  },
  danger: {
    borderColor: designTokens.colors.danger,
    background: `${designTokens.colors.danger}22`,
  },
};

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => removeToast(id), 3200);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: designTokens.spacing.lg,
          right: designTokens.spacing.lg,
          zIndex: 9999,
          display: "grid",
          gap: designTokens.spacing.sm,
          width: "min(24rem, calc(100vw - 2rem))",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
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
              pointerEvents: "auto",
            }}
          >
            <span style={{ fontWeight: 600 }}>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              style={{
                border: "none",
                background: "transparent",
                color: designTokens.colors.textMuted,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
