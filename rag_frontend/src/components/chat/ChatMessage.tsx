import type { CSSProperties, ReactNode } from "react";
import { designTokens } from "@/theme/tokens";

export type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  children?: ReactNode;
  status?: "default" | "error";
};

const bubbleStyles: Record<"user" | "assistant", CSSProperties> = {
  user: {
    background: "linear-gradient(135deg, #2a5de7 0%, #4f8cff 100%)",
    color: designTokens.colors.text,
    borderBottomRightRadius: "0.25rem",
  },
  assistant: {
    background: designTokens.colors.surface,
    color: designTokens.colors.text,
    border: `1px solid ${designTokens.colors.border}`,
    borderBottomLeftRadius: "0.25rem",
  },
};

export function ChatMessage({
  role,
  content,
  timestamp,
  children,
  status,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: designTokens.spacing.lg,
        animation: "fadeInUp 220ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: designTokens.spacing.md,
          maxWidth: "78%",
          alignItems: "flex-end",
        }}
      >
        {!isUser ? (
          <div
            style={{
              width: "2.2rem",
              height: "2.2rem",
              borderRadius: "50%",
              background: designTokens.colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            AI
          </div>
        ) : null}

        <div style={{ display: "grid", gap: designTokens.spacing.xs }}>
          <div
            style={{
              padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
              borderRadius: designTokens.radii.lg,
              boxShadow: designTokens.shadow.sm,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              lineHeight: 1.6,
              ...bubbleStyles[role],
              ...(status === "error"
                ? { border: `1px solid ${designTokens.colors.danger}` }
                : {}),
            }}
          >
            {children ?? content}
          </div>
          <div
            style={{
              fontSize: designTokens.typography.label,
              color: designTokens.colors.textMuted,
              padding: `0 ${designTokens.spacing.xs}`,
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
            }}
          >
            {timestamp}
          </div>
        </div>

        {isUser ? (
          <div
            style={{
              width: "2.2rem",
              height: "2.2rem",
              borderRadius: "50%",
              background: designTokens.colors.surfaceAlt,
              border: `1px solid ${designTokens.colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ME
          </div>
        ) : null}
      </div>
    </div>
  );
}
