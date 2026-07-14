export const CHAT_SESSION_CHANGED_EVENT = "rag-chat-session-changed";
export const CHAT_SESSIONS_REFRESH_EVENT = "rag-chat-sessions-refresh";

const STORAGE_PREFIX = "rag-chat-session";

export type ChatSessionChangedDetail = {
  sessionId: string | null;
};

export function chatSessionStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function getStoredChatSessionId(userId: string) {
  return window.localStorage.getItem(chatSessionStorageKey(userId));
}

export function setStoredChatSessionId(userId: string, sessionId: string) {
  window.localStorage.setItem(chatSessionStorageKey(userId), sessionId);
}

export function removeStoredChatSessionId(userId: string) {
  window.localStorage.removeItem(chatSessionStorageKey(userId));
}

export function notifyChatSessionChanged(sessionId: string | null) {
  window.dispatchEvent(
    new CustomEvent<ChatSessionChangedDetail>(CHAT_SESSION_CHANGED_EVENT, {
      detail: { sessionId },
    }),
  );
}

export function notifyChatSessionsRefresh() {
  window.dispatchEvent(new CustomEvent(CHAT_SESSIONS_REFRESH_EVENT));
}
