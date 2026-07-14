import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { deleteDocument, listDocuments } from "@/lib/api";
import { designTokens } from "@/theme/tokens";

type DocumentRow = {
  filename: string;
  status: string;
};

export function KnowledgeWorkspace() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const { showToast } = useToast();

  const refresh = async () => {
    setLoading(true);
    try {
      const documentsResponse = await listDocuments();
      const documentRows = (documentsResponse.documents ?? []).map(
        (document) => ({
          filename: String(document.filename || document.name || "unknown"),
          status: "Available",
        }),
      );
      setDocuments(documentRows);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to load knowledge data",
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
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "danger");
    }
  };

  const filteredDocuments = documents.filter((document) =>
    document.filename.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <Card
      title="Knowledge operations"
      description="Inspect stored documents from the backend"
    >
      <div style={{ display: "grid", gap: designTokens.spacing.lg }}>
        <Input
          label="Filter documents"
          placeholder="Search by filename"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        {loading ? <Loader /> : null}
        <Table
          columns={[
            { header: "Filename", accessor: "filename" },
            {
              header: "Status",
              accessor: "status",
              render: (value) => <Badge tone="success">{String(value)}</Badge>,
            },
            {
              header: "Actions",
              accessor: "filename",
              render: (value) => (
                <Button
                  variant="danger"
                  onClick={() => void handleDelete(String(value))}
                >
                  Delete
                </Button>
              ),
            },
          ]}
          rows={filteredDocuments}
        />
      </div>
    </Card>
  );
}
