import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const API_KEY = import.meta.env.VITE_API_KEY;
const DEFAULT_USER_ID = import.meta.env.VITE_RAG_USER_ID ?? "default-user";
const AUTH_TOKEN_STORAGE_KEY = "rag-auth-token";
const AUTH_USER_STORAGE_KEY = "rag-auth-user";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  if (API_KEY) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("X-API-Key", API_KEY);
    } else {
      config.headers = {
        ...config.headers,
        "X-API-Key": API_KEY,
      };
    }
  }

  return config;
});

function getErrorMessage(error, fallback = "Request failed") {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const detail =
      typeof data === "string"
        ? data
        : data?.detail || data?.message || error.message;

    return status
      ? `${fallback}: ${status} ${detail}`
      : `${fallback}: ${detail}`;
  }

  return error instanceof Error ? error.message : fallback;
}

async function request(config) {
  try {
    const response = await apiClient.request(config);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function getStoredUserId() {
  if (typeof window === "undefined") {
    return DEFAULT_USER_ID;
  }
  return window.localStorage.getItem(AUTH_USER_STORAGE_KEY) ?? DEFAULT_USER_ID;
}

function persistAuth(token, userId) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, userId);
}

function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

function normalizeApiPath(path) {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (API_BASE_URL.startsWith("/") && path.startsWith(`${API_BASE_URL}/`)) {
    return path.slice(API_BASE_URL.length);
  }

  return path.startsWith("/") ? path : `/${path}`;
}

async function loginUser(payload) {
  return request({
    url: "/auth/token",
    method: "POST",
    data: payload,
  });
}

async function registerUser(payload) {
  return request({
    url: "/auth/register",
    method: "POST",
    data: payload,
  });
}

async function getCurrentUser() {
  return request({
    url: "/auth/me",
    method: "GET",
  });
}

function logoutUser() {
  clearStoredAuth();
}

async function fetchHealth() {
  return request({
    url: "/health",
    method: "GET",
  });
}

async function ingestDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", DEFAULT_USER_ID);

  try {
    const response = await apiClient.post("/ingest", formData);
    return (
      response.data || {
        message: "Document ingested",
        chunks_added: 0,
        source_hash: "",
      }
    );
  } catch (error) {
    throw new Error(getErrorMessage(error, "Ingest failed"));
  }
}

async function queryDocuments(payload) {
  return request({
    url: "/query",
    method: "POST",
    data: payload,
  });
}

async function createChatSession(payload) {
  return request({
    url: "/chat/session",
    method: "POST",
    data: payload,
  });
}

async function listChatSessions(userId = DEFAULT_USER_ID) {
  return request({
    url: "/chat/sessions",
    method: "GET",
    params: {
      user_id: userId,
    },
  });
}

async function getChatSession(sessionId, userId = DEFAULT_USER_ID) {
  return request({
    url: `/chat/session/${encodeURIComponent(sessionId)}`,
    method: "GET",
    params: {
      user_id: userId,
    },
  });
}

async function deleteChatSession(sessionId, userId = DEFAULT_USER_ID) {
  return request({
    url: `/chat/session/${encodeURIComponent(sessionId)}`,
    method: "DELETE",
    params: {
      user_id: userId,
    },
  });
}

async function renameChatSession(sessionId, payload) {
  return request({
    url: `/chat/session/${encodeURIComponent(sessionId)}`,
    method: "PATCH",
    data: payload,
  });
}

async function chat(payload) {
  return request({
    url: "/chat",
    method: "POST",
    data: payload,
  });
}

async function listDocuments() {
  return request({
    url: "/documents",
    method: "GET",
  });
}

async function deleteDocument(filename) {
  return request({
    url: `/documents/${encodeURIComponent(filename)}`,
    method: "DELETE",
  });
}

async function fetchDocumentBlob(source) {
  const candidates = [];

  if (source) {
    candidates.push(source);
  }

  if (
    source &&
    !source.startsWith("http://") &&
    !source.startsWith("https://")
  ) {
    if (!source.startsWith("/")) {
      candidates.push(`/download/${encodeURIComponent(source)}`);
      candidates.push(`/download/${encodeURIComponent(source)}?download=true`);
    }
  }

  let lastError = null;

  for (const candidate of candidates.map(normalizeApiPath)) {
    try {
      const response = await apiClient.get(candidate, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf,application/octet-stream,*/*",
        },
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        return response.data;
      }

      lastError = new Error(
        `View failed: ${response.status} ${response.statusText}`,
      );

      if (response.status !== 405 && response.status !== 404) {
        break;
      }
    } catch (error) {
      lastError = new Error(getErrorMessage(error, "Unable to view document"));
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Unable to view document");
}

export {
  DEFAULT_USER_ID,
  chat,
  clearStoredAuth,
  createChatSession,
  deleteChatSession,
  deleteDocument,
  fetchDocumentBlob,
  fetchHealth,
  getChatSession,
  getCurrentUser,
  getStoredAuthToken,
  getStoredUserId,
  ingestDocument,
  listChatSessions,
  listDocuments,
  loginUser,
  logoutUser,
  persistAuth,
  queryDocuments,
  registerUser,
  renameChatSession,
};
