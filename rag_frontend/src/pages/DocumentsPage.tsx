import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { deleteDocument, fetchDocumentBlob, listDocuments } from "@/lib/api";
import { designTokens } from "@/theme/tokens";

type DocumentRow = {
  filename: string;
  viewUrl?: string;
};

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DocumentRow | null>(null);
  const { showToast } = useToast();

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await listDocuments();
      const rows = (response.documents ?? []).map((document) => ({
        filename: String(document.filename || document.name || "unknown"),
        viewUrl: String(document.view_url || document.download_url || ""),
      }));
      setDocuments(rows);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to load documents",
        "danger",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleDelete = async (filename: string) => {
    try {
      await deleteDocument(filename);
      await refresh();
      setPendingDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "danger");
    }
  };

  const confirmDelete = (document: DocumentRow) => {
    setPendingDelete(document);
  };

  const cancelDelete = () => {
    setPendingDelete(null);
  };

  const handleView = async (filename: string, viewUrl?: string) => {
    const viewer = window.open("", "_blank");

    try {
      const blob = await fetchDocumentBlob(viewUrl || filename);
      const url = window.URL.createObjectURL(blob);

      if (viewer) {
        viewer.location.href = url;
      } else {
        window.open(url, "_blank");
      }

      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      viewer?.close();
      showToast(
        err instanceof Error ? err.message : "Unable to view document",
        "danger",
      );
    }
  };

  const filteredDocuments = documents.filter((document) =>
    document.filename.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div style={{ display: "grid", gap: designTokens.spacing.xl }}>
      <Card
        title="Documents"
        description="Review and manage uploaded documents"
      >
        <div style={{ display: "grid", gap: designTokens.spacing.lg }}>
          {documents.length > 0 ? (
            <Input
              label="Filter documents"
              placeholder="Search by filename"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          ) : null}
          {loading ? <Loader /> : null}
          {filteredDocuments.length === 0 && !loading ? (
            <div
              style={{
                padding: `${designTokens.spacing.xl} ${designTokens.spacing.lg}`,
                border: `1px dashed ${designTokens.colors.border}`,
                borderRadius: designTokens.radii.md,
                color: designTokens.colors.textMuted,
                textAlign: "center",
                background: designTokens.colors.surfaceAlt,
              }}
            >
              No documents available yet.
            </div>
          ) : (
            <Table
              columns={[
                { header: "Filename", accessor: "filename" },
                {
                  header: "Actions",
                  accessor: "filename",
                  render: (value, row) => (
                    <div
                      style={{
                        display: "flex",
                        gap: designTokens.spacing.sm,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void handleView(String(value), row?.viewUrl)
                        }
                        aria-label={`View ${String(value)}`}
                        title={`View ${String(value)}`}
                        style={{ padding: `${designTokens.spacing.sm}` }}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() =>
                          confirmDelete({
                            filename: String(value),
                            viewUrl: row?.viewUrl,
                          })
                        }
                        aria-label={`Delete ${String(value)}`}
                        title={`Delete ${String(value)}`}
                        style={{ padding: `${designTokens.spacing.sm}` }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ),
                },
              ]}
              rows={filteredDocuments}
            />
          )}
        </div>
      </Card>

      <Modal
        open={Boolean(pendingDelete)}
        title="Delete document"
        onClose={cancelDelete}
      >
        <div style={{ display: "grid", gap: designTokens.spacing.lg }}>
          <p style={{ margin: 0, color: designTokens.colors.textMuted }}>
            Are you sure you want to delete{" "}
            {pendingDelete?.filename ?? "this document"}? This action cannot be
            undone.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: designTokens.spacing.md,
            }}
          >
            <Button variant="secondary" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                pendingDelete?.filename
                  ? void handleDelete(pendingDelete.filename)
                  : undefined
              }
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
