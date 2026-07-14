import type { ReactNode } from "react";
import { designTokens } from "@/theme/tokens";

type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
};

export function Table<T extends Record<string, unknown>>({
  columns,
  rows,
}: TableProps<T>) {
  return (
    <div
      style={{
        overflowX: "auto",
        border: `1px solid ${designTokens.colors.border}`,
        borderRadius: designTokens.radii.md,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: designTokens.colors.surfaceAlt }}>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.accessor)}
                style={{
                  textAlign: "left",
                  padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
                  color: designTokens.colors.textMuted,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              style={{ borderTop: `1px solid ${designTokens.colors.border}` }}
            >
              {columns.map((column) => (
                <td
                  key={String(column.accessor)}
                  style={{
                    padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
                  }}
                >
                  {column.render
                    ? column.render(row[column.accessor], row)
                    : String(row[column.accessor] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
