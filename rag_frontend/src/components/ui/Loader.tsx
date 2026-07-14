import { designTokens } from "@/theme/tokens";

export function Loader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: designTokens.spacing.xl,
      }}
    >
      <div
        style={{
          width: "2rem",
          height: "2rem",
          border: `3px solid ${designTokens.colors.border}`,
          borderTopColor: designTokens.colors.primary,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
}
