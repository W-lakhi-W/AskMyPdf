import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText, FileUp, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useDashboardData } from "@/hooks/useDashboardData";
import { designTokens } from "@/theme/tokens";
function IngestPage() {
  const { health, loading, error, uploadDocument, refreshData } = useDashboardData();
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const handleFile = (file) => {
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
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };
  return /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: designTokens.spacing.xl }, children: /* @__PURE__ */ jsx(
    Card,
    {
      title: "Ingest data",
      description: "Upload PDFs into the retrieval pipeline",
      children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.lg }, children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "grid",
              gap: designTokens.spacing.md,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
            },
            children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.radii.md,
                    background: designTokens.colors.surfaceAlt
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          color: designTokens.colors.textMuted,
                          marginBottom: 4
                        },
                        children: "System health"
                      }
                    ),
                    /* @__PURE__ */ jsx("strong", { children: health?.status ?? "Checking..." })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.radii.md,
                    background: designTokens.colors.surfaceAlt
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          color: designTokens.colors.textMuted,
                          marginBottom: 4
                        },
                        children: "Chunks count"
                      }
                    ),
                    /* @__PURE__ */ jsx("strong", { children: health?.vector_count ?? 0 })
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "label",
          {
            onDragOver: (event) => {
              event.preventDefault();
              setIsDragging(true);
            },
            onDragLeave: () => setIsDragging(false),
            onDrop: handleDrop,
            style: {
              display: "grid",
              gap: designTokens.spacing.lg,
              padding: designTokens.spacing.xl,
              border: `1px dashed ${isDragging || selectedFile ? designTokens.colors.primary : designTokens.colors.border}`,
              borderRadius: designTokens.radii.md,
              background: isDragging || selectedFile ? `${designTokens.colors.primary}14` : designTokens.colors.surfaceAlt,
              cursor: "pointer",
              transition: designTokens.transitions.default
            },
            children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: designTokens.spacing.lg
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          width: "3.25rem",
                          height: "3.25rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: designTokens.radii.md,
                          background: designTokens.colors.background,
                          color: selectedFile ? designTokens.colors.success : designTokens.colors.primary,
                          flexShrink: 0
                        },
                        children: selectedFile ? /* @__PURE__ */ jsx(CheckCircle2, { size: 22 }) : /* @__PURE__ */ jsx(FileUp, { size: 22 })
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.xs }, children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            color: designTokens.colors.text,
                            fontSize: "1rem",
                            fontWeight: 700
                          },
                          children: selectedFile ? "PDF ready to upload" : "Upload a PDF"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            color: designTokens.colors.textMuted,
                            fontSize: designTokens.typography.label
                          },
                          children: "Drag and drop a PDF here, or choose one from your device."
                        }
                      )
                    ] })
                  ]
                }
              ),
              selectedFile ? /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: designTokens.spacing.md,
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.radii.md,
                    border: `1px solid ${designTokens.colors.border}`,
                    background: designTokens.colors.background
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          width: "2.5rem",
                          height: "2.5rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: designTokens.radii.sm,
                          background: designTokens.colors.surfaceAlt,
                          color: designTokens.colors.primary
                        },
                        children: /* @__PURE__ */ jsx(FileText, { size: 18 })
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            color: designTokens.colors.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: 600
                          },
                          children: selectedFile.name
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          style: {
                            color: designTokens.colors.textMuted,
                            fontSize: designTokens.typography.label
                          },
                          children: [
                            (selectedFile.size / 1024 / 1024).toFixed(2),
                            " MB"
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: (event) => {
                          event.preventDefault();
                          clearSelectedFile();
                        },
                        title: "Remove selected PDF",
                        "aria-label": "Remove selected PDF",
                        style: {
                          width: "2.25rem",
                          height: "2.25rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: designTokens.radii.sm,
                          border: `1px solid ${designTokens.colors.border}`,
                          background: designTokens.colors.surfaceAlt,
                          color: designTokens.colors.textMuted,
                          cursor: "pointer"
                        },
                        children: /* @__PURE__ */ jsx(X, { size: 16 })
                      }
                    )
                  ]
                }
              ) : null,
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
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
                    fontWeight: 600
                  },
                  children: [
                    /* @__PURE__ */ jsx(Upload, { size: 16 }),
                    selectedFile ? "Replace PDF" : "Choose PDF"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  accept: ".pdf",
                  onChange: (event) => handleFile(event.target.files?.[0]),
                  style: { display: "none" }
                },
                fileInputKey
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleUpload,
            disabled: !selectedFile || loading,
            style: { justifySelf: "end" },
            children: loading ? "Uploading..." : "Upload document"
          }
        )
      ] })
    }
  ) });
}
export {
  IngestPage
};
