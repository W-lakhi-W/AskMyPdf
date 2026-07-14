import type {
  ChatRequest,
  ChatResponse,
  ChatSession,
  ChatSessionDetail,
  CreateChatSessionRequest,
  DeleteResponse,
  HealthResponse,
  IngestedPDFsResponse,
  IngestResponse,
  QueryRequest,
  QueryResponse,
  RenameChatSessionRequest,
} from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const API_KEY = import.meta.env.VITE_API_KEY;
export const DEFAULT_USER_ID =
  import.meta.env.VITE_RAG_USER_ID ?? "default-user";

function getAuthHeaders(): HeadersInit {
  return API_KEY ? { "X-API-Key": API_KEY } : {};
}

function parseJson<T>(text: string, fallback: T): T {
  if (!text.trim()) {
    return fallback;
  }

  return JSON.parse(text) as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text.trim()) {
    return undefined as T;
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but received: ${text}`);
  }

  return parseJson<T>(text, undefined as T);
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export async function ingestDocument(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", DEFAULT_USER_ID);

  const response = await fetch(`${API_BASE_URL}/ingest`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ingest failed: ${response.status} ${text}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text.trim()) {
    return {
      message: "Document ingested",
      chunks_added: 0,
      source_hash: "",
    };
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but received: ${text}`);
  }

  return parseJson<IngestResponse>(text, {
    message: "Document ingested",
    chunks_added: 0,
    source_hash: "",
  });
}

export async function queryDocuments(
  payload: QueryRequest,
): Promise<QueryResponse> {
  return request<QueryResponse>("/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function createChatSession(
  payload: CreateChatSessionRequest,
): Promise<ChatSession> {
  return request<ChatSession>("/chat/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function listChatSessions(
  userId = DEFAULT_USER_ID,
): Promise<ChatSession[]> {
  return request<ChatSession[]>(
    `/chat/sessions?user_id=${encodeURIComponent(userId)}`,
  );
}

export async function getChatSession(
  sessionId: string,
  userId = DEFAULT_USER_ID,
): Promise<ChatSessionDetail> {
  return request<ChatSessionDetail>(
    `/chat/session/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(
      userId,
    )}`,
  );
}

export async function deleteChatSession(
  sessionId: string,
  userId = DEFAULT_USER_ID,
): Promise<DeleteResponse> {
  return request<DeleteResponse>(
    `/chat/session/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(
      userId,
    )}`,
    { method: "DELETE" },
  );
}

export async function renameChatSession(
  sessionId: string,
  payload: RenameChatSessionRequest,
): Promise<ChatSession> {
  return request<ChatSession>(
    `/chat/session/${encodeURIComponent(sessionId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function chat(payload: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function listDocuments(): Promise<IngestedPDFsResponse> {
  return request<IngestedPDFsResponse>("/documents");
}

export async function deleteDocument(
  filename: string,
): Promise<DeleteResponse> {
  return request<DeleteResponse>(`/documents/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
}

export async function fetchDocumentBlob(source: string): Promise<Blob> {
  const candidates = [source].filter(Boolean);

  if (!source.startsWith("http://") && !source.startsWith("https://")) {
    if (source.startsWith("/")) {
      candidates.push(`${API_BASE_URL}${source}`);
    } else {
      candidates.push(`/download/${encodeURIComponent(source)}`);
      candidates.push(`/download/${encodeURIComponent(source)}?download=true`);
      candidates.push(`${API_BASE_URL}/download/${encodeURIComponent(source)}`);
      candidates.push(
        `${API_BASE_URL}/download/${encodeURIComponent(source)}?download=true`,
      );
    }
  }

  let lastError: Error | null = null;

  for (const target of candidates) {
    try {
      const response = await fetch(
        target.startsWith("http") ? target : `${API_BASE_URL}${target}`,
        {
          method: "GET",
          headers: {
            ...getAuthHeaders(),
            Accept: "application/pdf,application/octet-stream,*/*",
          },
        },
      );

      if (response.ok) {
        return response.blob();
      }

      const text = await response.text();
      lastError = new Error(`View failed: ${response.status} ${text}`);

      if (response.status !== 405 && response.status !== 404) {
        break;
      }
    } catch (err) {
      lastError =
        err instanceof Error ? err : new Error("Unable to view document");
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Unable to view document");
}
