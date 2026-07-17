import { jsx } from "react/jsx-runtime";
import { designTokens } from "@/theme/tokens";
import { KnowledgeWorkspace } from "@/features/knowledge/KnowledgeWorkspace";
function KnowledgePage() {
  return /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: designTokens.spacing.xl }, children: /* @__PURE__ */ jsx(KnowledgeWorkspace, {}) });
}
export {
  KnowledgePage
};
