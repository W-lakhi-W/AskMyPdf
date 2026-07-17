import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { useDashboardData } from "@/hooks/useDashboardData";
import { designTokens } from "@/theme/tokens";
function DashboardPage() {
  const {
    health,
    documents,
    queryResult,
    loading,
    error,
    runQuery,
    uploadDocument,
    refreshData
  } = useDashboardData();
  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const { showToast } = useToast();
  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadDocument(selectedFile);
    setSelectedFile(null);
    showToast("Document uploaded successfully", "success");
  };
  const handleQuery = async () => {
    if (!query.trim()) return;
    await runQuery(query);
    showToast("Query completed", "success");
  };
  useEffect(() => {
    if (error) {
      showToast(error, "danger");
    }
  }, [error, showToast]);
  return /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.xl }, children: [
    /* @__PURE__ */ jsxs(
      "section",
      {
        style: {
          display: "grid",
          gap: designTokens.spacing.lg,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
        },
        children: [
          /* @__PURE__ */ jsx(
            Card,
            {
              title: "System health",
              description: "Live backend health from FastAPI",
              children: loading && !health ? /* @__PURE__ */ jsx(Loader, {}) : health ? /* @__PURE__ */ jsxs(Alert, { tone: "success", children: [
                health.status,
                " - ",
                health.app
              ] }) : /* @__PURE__ */ jsx(Alert, { tone: "warning", children: "Unable to load health status" })
            }
          ),
          /* @__PURE__ */ jsx(
            Card,
            {
              title: "Knowledge coverage",
              description: "Indexed documents and vector store status",
              children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.md }, children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      color: designTokens.colors.textMuted
                    },
                    children: [
                      /* @__PURE__ */ jsx("span", { children: "Documents stored" }),
                      /* @__PURE__ */ jsx("strong", { style: { color: designTokens.colors.text }, children: documents?.documents?.length ?? 0 })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      color: designTokens.colors.textMuted
                    },
                    children: [
                      /* @__PURE__ */ jsx("span", { children: "Chunks count" }),
                      /* @__PURE__ */ jsx("strong", { style: { color: designTokens.colors.text }, children: health?.vector_count ?? 0 })
                    ]
                  }
                )
              ] })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      Card,
      {
        title: "Ingest document",
        description: "Upload PDFs to the backend ingestion pipeline",
        children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.md }, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "file",
              accept: ".pdf",
              onChange: (event) => setSelectedFile(event.target.files?.[0] ?? null)
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                display: "flex",
                gap: designTokens.spacing.md,
                flexWrap: "wrap"
              },
              children: /* @__PURE__ */ jsx(Button, { onClick: handleUpload, disabled: !selectedFile || loading, children: "Upload" })
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsx(
      Card,
      {
        title: "Retrieval workspace",
        description: "Query the RAG backend and inspect the returned sources",
        children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.lg }, children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              label: "Query",
              placeholder: "Ask the knowledge base",
              value: query,
              onChange: (event) => setQuery(event.target.value)
            }
          ),
          /* @__PURE__ */ jsx(Button, { onClick: handleQuery, disabled: !query.trim() || loading, children: "Run retrieval" }),
          loading && !queryResult ? /* @__PURE__ */ jsx(Loader, {}) : null,
          queryResult ? /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.md }, children: [
            /* @__PURE__ */ jsx(Alert, { tone: "success", children: queryResult.results }),
            /* @__PURE__ */ jsxs("div", { style: { color: designTokens.colors.textMuted }, children: [
              /* @__PURE__ */ jsx("strong", { style: { color: designTokens.colors.text }, children: "Sources:" }),
              " ",
              queryResult.sources.map((source) => source.source ?? "unknown").join(", ") || "None"
            ] })
          ] }) : null
        ] })
      }
    )
  ] });
}
export {
  DashboardPage
};
