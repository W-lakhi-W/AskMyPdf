export const designTokens = {
  colors: {
    background: "#07111f",
    surface: "#101c31",
    surfaceAlt: "#16263c",
    border: "#263952",
    text: "#f8fafc",
    textMuted: "#8da0b8",
    primary: "#4f8cff",
    primaryHover: "#3f78e5",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#38bdf8",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    xxl: "2rem",
  },
  radii: {
    sm: "0.375rem",
    md: "0.75rem",
    lg: "1rem",
    pill: "999px",
  },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.2)",
    md: "0 10px 30px rgba(0,0,0,0.25)",
    lg: "0 20px 45px rgba(0,0,0,0.3)",
  },
  typography: {
    body: "0.95rem",
    label: "0.85rem",
    heading: "1.25rem",
    title: "1.7rem",
  },
  transitions: {
    default: "180ms ease",
  },
} as const;
