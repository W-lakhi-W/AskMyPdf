import { jsx, jsxs } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
function Table({
  columns,
  rows
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        overflowX: "auto",
        border: `1px solid ${designTokens.colors.border}`,
        borderRadius: designTokens.radii.md
      },
      children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
        /* @__PURE__ */ jsx("thead", { style: { background: designTokens.colors.surfaceAlt }, children: /* @__PURE__ */ jsx("tr", { children: columns.map((column) => /* @__PURE__ */ jsx(
          "th",
          {
            style: {
              textAlign: "left",
              padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
              color: designTokens.colors.textMuted
            },
            children: column.header
          },
          String(column.accessor)
        )) }) }),
        /* @__PURE__ */ jsx("tbody", { children: rows.map((row, index) => /* @__PURE__ */ jsx(
          "tr",
          {
            style: { borderTop: `1px solid ${designTokens.colors.border}` },
            children: columns.map((column) => /* @__PURE__ */ jsx(
              "td",
              {
                style: {
                  padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`
                },
                children: column.render ? column.render(row[column.accessor], row) : String(row[column.accessor] ?? "")
              },
              String(column.accessor)
            ))
          },
          index
        )) })
      ] })
    }
  );
}
export {
  Table
};
