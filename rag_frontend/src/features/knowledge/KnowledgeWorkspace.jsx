import { jsx, jsxs } from "react/jsx-runtime";
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
function KnowledgeWorkspace() {
  const [documents, setDocuments] = useState([]);
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
          status: "Available"
        })
      );
      setDocuments(documentRows);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to load knowledge data",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const handleDelete = async (filename) => {
    try {
      await deleteDocument(filename);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "danger");
    }
  };
  const filteredDocuments = documents.filter(
    (document) => document.filename.toLowerCase().includes(filter.toLowerCase())
  );
  return /* @__PURE__ */ jsx(
    Card,
    {
      title: "Knowledge operations",
      description: "Inspect stored documents from the backend",
      children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.lg }, children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            label: "Filter documents",
            placeholder: "Search by filename",
            value: filter,
            onChange: (event) => setFilter(event.target.value)
          }
        ),
        loading ? /* @__PURE__ */ jsx(Loader, {}) : null,
        /* @__PURE__ */ jsx(
          Table,
          {
            columns: [
              { header: "Filename", accessor: "filename" },
              {
                header: "Status",
                accessor: "status",
                render: (value) => /* @__PURE__ */ jsx(Badge, { tone: "success", children: String(value) })
              },
              {
                header: "Actions",
                accessor: "filename",
                render: (value) => /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "danger",
                    onClick: () => void handleDelete(String(value)),
                    children: "Delete"
                  }
                )
              }
            ],
            rows: filteredDocuments
          }
        )
      ] })
    }
  );
}
export {
  KnowledgeWorkspace
};
