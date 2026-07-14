import type { ReactNode } from "react";
import { designTokens } from "@/theme/tokens";

type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function Card({ title, description, children, actions }: CardProps) {
  return (
    <section
      style={{
        background: designTokens.colors.surface,
        border: `1px solid ${designTokens.colors.border}`,
        borderRadius: designTokens.radii.lg,
        boxShadow: designTokens.shadow.sm,
        padding: designTokens.spacing.xl,
      }}
    >
      {(title || description || actions) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: designTokens.spacing.md,
            marginBottom: designTokens.spacing.lg,
          }}
        >
          <div>
            {title ? (
              <h3
                style={{ margin: 0, fontSize: designTokens.typography.heading }}
              >
                {title}
              </h3>
            ) : null}
            {description ? (
              <p
                style={{
                  margin: designTokens.spacing.xs + " 0 0",
                  color: designTokens.colors.textMuted,
                }}
              >
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
