import { useEffect, useState } from "react";
import {
  fetchHealth,
  ingestDocument,
  listDocuments,
  queryDocuments
} from "@/lib/api";
function useDashboardData() {
  const [health, setHealth] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthResponse, documentsResponse] = await Promise.all([
        fetchHealth(),
        listDocuments()
      ]);
      setHealth(healthResponse);
      setDocuments(documentsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  const runQuery = async (query) => {
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
  const uploadDocument = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ingestDocument(file);
      await refreshData();
      return result;
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
    refreshData
  };
}
export {
  useDashboardData
};
