import { designTokens } from "@/theme/tokens";
import { KnowledgeWorkspace } from "@/features/knowledge/KnowledgeWorkspace";

export function KnowledgePage() {
  return (
    <div style={{ display: "grid", gap: designTokens.spacing.xl }}>
      <KnowledgeWorkspace />
    </div>
  );
}
