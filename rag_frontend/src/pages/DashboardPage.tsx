import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { useDashboardData } from "@/hooks/useDashboardData";
import { designTokens } from "@/theme/tokens";

export function DashboardPage() {
  const {
    health,
    documents,
    queryResult,
    loading,
    error,
    runQuery,
    uploadDocument,
    refreshData,
  } = useDashboardData();
  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  return (
    <div style={{ display: "grid", gap: designTokens.spacing.xl }}>
      <section
        style={{
          display: "grid",
          gap: designTokens.spacing.lg,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <Card
          title="System health"
          description="Live backend health from FastAPI"
        >
          {loading && !health ? (
            <Loader />
          ) : health ? (
            <Alert tone="success">
              {health.status} - {health.app}
            </Alert>
          ) : (
            <Alert tone="warning">Unable to load health status</Alert>
          )}
        </Card>
        <Card
          title="Knowledge coverage"
          description="Indexed documents and vector store status"
        >
          <div style={{ display: "grid", gap: designTokens.spacing.md }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: designTokens.colors.textMuted,
              }}
            >
              <span>Documents stored</span>
              <strong style={{ color: designTokens.colors.text }}>
                {documents?.documents?.length ?? 0}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: designTokens.colors.textMuted,
              }}
            >
              <span>Chunks count</span>
              <strong style={{ color: designTokens.colors.text }}>
                {health?.vector_count ?? 0}
              </strong>
            </div>
          </div>
        </Card>
      </section>

      <Card
        title="Ingest document"
        description="Upload PDFs to the backend ingestion pipeline"
      >
        <div style={{ display: "grid", gap: designTokens.spacing.md }}>
          <input
            type="file"
            accept=".pdf"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
          />
          <div
            style={{
              display: "flex",
              gap: designTokens.spacing.md,
              flexWrap: "wrap",
            }}
          >
            <Button onClick={handleUpload} disabled={!selectedFile || loading}>
              Upload
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="Retrieval workspace"
        description="Query the RAG backend and inspect the returned sources"
      >
        <div style={{ display: "grid", gap: designTokens.spacing.lg }}>
          <Input
            label="Query"
            placeholder="Ask the knowledge base"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button onClick={handleQuery} disabled={!query.trim() || loading}>
            Run retrieval
          </Button>
          {loading && !queryResult ? <Loader /> : null}
          {queryResult ? (
            <div style={{ display: "grid", gap: designTokens.spacing.md }}>
              <Alert tone="success">{queryResult.results}</Alert>
              <div style={{ color: designTokens.colors.textMuted }}>
                <strong style={{ color: designTokens.colors.text }}>
                  Sources:
                </strong>{" "}
                {queryResult.sources
                  .map((source) => source.source ?? "unknown")
                  .join(", ") || "None"}
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
