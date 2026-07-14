import { useEffect, useState, type DragEvent } from "react";
import { CheckCircle2, FileText, FileUp, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { useDashboardData } from "@/hooks/useDashboardData";
import { designTokens } from "@/theme/tokens";

export function IngestPage() {
  const { health, loading, error, uploadDocument, refreshData } =
    useDashboardData();
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const result = await uploadDocument(selectedFile);
    setSelectedFile(null);
    setFileInputKey((current) => current + 1);
    if (result) {
      showToast("Document uploaded successfully", "success");
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileInputKey((current) => current + 1);
  };

  useEffect(() => {
    if (error) {
      showToast(error, "danger");
    }
  }, [error, showToast]);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div style={{ display: "grid", gap: designTokens.spacing.xl }}>
      <Card
        title="Ingest data"
        description="Upload PDFs into the retrieval pipeline"
      >
        <div style={{ display: "grid", gap: designTokens.spacing.lg }}>
          <div
            style={{
              display: "grid",
              gap: designTokens.spacing.md,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div
              style={{
                padding: designTokens.spacing.md,
                borderRadius: designTokens.radii.md,
                background: designTokens.colors.surfaceAlt,
              }}
            >
              <div
                style={{
                  color: designTokens.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                System health
              </div>
              <strong>{health?.status ?? "Checking..."}</strong>
            </div>
            <div
              style={{
                padding: designTokens.spacing.md,
                borderRadius: designTokens.radii.md,
                background: designTokens.colors.surfaceAlt,
              }}
            >
              <div
                style={{
                  color: designTokens.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                Chunks count
              </div>
              <strong>{health?.vector_count ?? 0}</strong>
            </div>
          </div>

          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              display: "grid",
              gap: designTokens.spacing.lg,
              padding: designTokens.spacing.xl,
              border: `1px dashed ${
                isDragging || selectedFile
                  ? designTokens.colors.primary
                  : designTokens.colors.border
              }`,
              borderRadius: designTokens.radii.md,
              background:
                isDragging || selectedFile
                  ? `${designTokens.colors.primary}14`
                  : designTokens.colors.surfaceAlt,
              cursor: "pointer",
              transition: designTokens.transitions.default,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: designTokens.spacing.lg,
              }}
            >
              <div
                style={{
                  width: "3.25rem",
                  height: "3.25rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: designTokens.radii.md,
                  background: designTokens.colors.background,
                  color: selectedFile
                    ? designTokens.colors.success
                    : designTokens.colors.primary,
                  flexShrink: 0,
                }}
              >
                {selectedFile ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <FileUp size={22} />
                )}
              </div>
              <div style={{ display: "grid", gap: designTokens.spacing.xs }}>
                <div
                  style={{
                    color: designTokens.colors.text,
                    fontSize: "1rem",
                    fontWeight: 700,
                  }}
                >
                  {selectedFile ? "PDF ready to upload" : "Upload a PDF"}
                </div>
                <div
                  style={{
                    color: designTokens.colors.textMuted,
                    fontSize: designTokens.typography.label,
                  }}
                >
                  Drag and drop a PDF here, or choose one from your device.
                </div>
              </div>
            </div>

            {selectedFile ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: designTokens.spacing.md,
                  padding: designTokens.spacing.md,
                  borderRadius: designTokens.radii.md,
                  border: `1px solid ${designTokens.colors.border}`,
                  background: designTokens.colors.background,
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: designTokens.radii.sm,
                    background: designTokens.colors.surfaceAlt,
                    color: designTokens.colors.primary,
                  }}
                >
                  <FileText size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: designTokens.colors.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    {selectedFile.name}
                  </div>
                  <div
                    style={{
                      color: designTokens.colors.textMuted,
                      fontSize: designTokens.typography.label,
                    }}
                  >
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    clearSelectedFile();
                  }}
                  title="Remove selected PDF"
                  aria-label="Remove selected PDF"
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: designTokens.radii.sm,
                    border: `1px solid ${designTokens.colors.border}`,
                    background: designTokens.colors.surfaceAlt,
                    color: designTokens.colors.textMuted,
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: designTokens.spacing.sm,
                justifySelf: "start",
                padding: `${designTokens.spacing.sm} ${designTokens.spacing.lg}`,
                borderRadius: designTokens.radii.md,
                border: `1px solid ${designTokens.colors.primary}`,
                background: designTokens.colors.primary,
                color: designTokens.colors.text,
                fontWeight: 600,
              }}
            >
              <Upload size={16} />
              {selectedFile ? "Replace PDF" : "Choose PDF"}
            </div>
            <input
              key={fileInputKey}
              type="file"
              accept=".pdf"
              onChange={(event) => handleFile(event.target.files?.[0])}
              style={{ display: "none" }}
            />
          </label>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            style={{ justifySelf: "end" }}
          >
            {loading ? "Uploading..." : "Upload document"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
