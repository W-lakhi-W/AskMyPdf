import { useEffect, useState } from "react";
import {
  fetchHealth,
  ingestDocument,
  listDocuments,
  queryDocuments,
} from "@/lib/api";
import type {
  HealthResponse,
  IngestedPDFsResponse,
  IngestResponse,
  QueryResponse,
} from "@/types/api";

export function useDashboardData() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [documents, setDocuments] = useState<IngestedPDFsResponse | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthResponse, documentsResponse] = await Promise.all([
        fetchHealth(),
        listDocuments(),
      ]);
      setHealth(healthResponse);
      setDocuments(documentsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const runQuery = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryDocuments({ query });
      setQueryResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ingestDocument(file);
      await refreshData();
      return result as IngestResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  return {
    health,
    documents,
    queryResult,
    loading,
    error,
    runQuery,
    uploadDocument,
    refreshData,
  };
}
