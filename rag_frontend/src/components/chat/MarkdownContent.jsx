import { jsx } from "react/jsx-runtime";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { designTokens } from "@/theme/tokens";
function MarkdownContent({ content }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        display: "grid",
        gap: designTokens.spacing.sm,
        color: "inherit"
      },
      children: /* @__PURE__ */ jsx(
        ReactMarkdown,
        {
          remarkPlugins: [remarkGfm],
          components: {
            h1: ({ ...props }) => /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: "1.15rem" }, ...props }),
            h2: ({ ...props }) => /* @__PURE__ */ jsx("h2", { style: { margin: 0, fontSize: "1.05rem" }, ...props }),
            h3: ({ ...props }) => /* @__PURE__ */ jsx("h3", { style: { margin: 0, fontSize: "1rem" }, ...props }),
            p: ({ ...props }) => /* @__PURE__ */ jsx("p", { style: { margin: 0 }, ...props }),
            ul: ({ ...props }) => /* @__PURE__ */ jsx("ul", { style: { margin: 0, paddingLeft: "1.1rem" }, ...props }),
            ol: ({ ...props }) => /* @__PURE__ */ jsx("ol", { style: { margin: 0, paddingLeft: "1.1rem" }, ...props }),
            li: ({ ...props }) => /* @__PURE__ */ jsx("li", { style: { marginBottom: "0.2rem" }, ...props }),
            table: ({ ...props }) => /* @__PURE__ */ jsx(
              "table",
              {
                style: { width: "100%", borderCollapse: "collapse" },
                ...props
              }
            ),
            th: ({ ...props }) => /* @__PURE__ */ jsx(
              "th",
              {
                style: {
                  textAlign: "left",
                  padding: "0.3rem 0.4rem",
                  borderBottom: `1px solid ${designTokens.colors.border}`
                },
                ...props
              }
            ),
            td: ({ ...props }) => /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem 0.4rem" }, ...props }),
            code: ({ className, children, ...props }) => {
              const value = String(children).replace(/`/g, "");
              const isInline = !className;
              return isInline ? /* @__PURE__ */ jsx(
                "code",
                {
                  style: {
                    background: designTokens.colors.surfaceAlt,
                    padding: "0.15rem 0.35rem",
                    borderRadius: designTokens.radii.sm
                  },
                  ...props,
                  children: value
                }
              ) : /* @__PURE__ */ jsx(
                "pre",
                {
                  style: {
                    margin: 0,
                    padding: designTokens.spacing.md,
                    overflowX: "auto",
                    borderRadius: designTokens.radii.md,
                    background: "#07111f",
                    color: "#e2e8f0"
                  },
                  children: /* @__PURE__ */ jsx("code", { className, ...props, children: value })
                }
              );
            },
            a: ({ ...props }) => /* @__PURE__ */ jsx("a", { style: { color: designTokens.colors.info }, ...props })
          },
          children: content
        }
      )
    }
  );
}
export {
  MarkdownContent
};
