import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { designTokens } from "@/theme/tokens";

type MarkdownContentProps = {
  content: string;
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: designTokens.spacing.sm,
        color: "inherit",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 style={{ margin: 0, fontSize: "1.15rem" }} {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 style={{ margin: 0, fontSize: "1.05rem" }} {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 style={{ margin: 0, fontSize: "1rem" }} {...props} />
          ),
          p: ({ ...props }) => <p style={{ margin: 0 }} {...props} />,
          ul: ({ ...props }) => (
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }} {...props} />
          ),
          ol: ({ ...props }) => (
            <ol style={{ margin: 0, paddingLeft: "1.1rem" }} {...props} />
          ),
          li: ({ ...props }) => (
            <li style={{ marginBottom: "0.2rem" }} {...props} />
          ),
          table: ({ ...props }) => (
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              {...props}
            />
          ),
          th: ({ ...props }) => (
            <th
              style={{
                textAlign: "left",
                padding: "0.3rem 0.4rem",
                borderBottom: `1px solid ${designTokens.colors.border}`,
              }}
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td style={{ padding: "0.3rem 0.4rem" }} {...props} />
          ),
          code: ({ className, children, ...props }) => {
            const value = String(children).replace(/`/g, "");
            const isInline = !className;
            return isInline ? (
              <code
                style={{
                  background: designTokens.colors.surfaceAlt,
                  padding: "0.15rem 0.35rem",
                  borderRadius: designTokens.radii.sm,
                }}
                {...props}
              >
                {value}
              </code>
            ) : (
              <pre
                style={{
                  margin: 0,
                  padding: designTokens.spacing.md,
                  overflowX: "auto",
                  borderRadius: designTokens.radii.md,
                  background: "#07111f",
                  color: "#e2e8f0",
                }}
              >
                <code className={className} {...props}>
                  {value}
                </code>
              </pre>
            );
          },
          a: ({ ...props }) => (
            <a style={{ color: designTokens.colors.info }} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
