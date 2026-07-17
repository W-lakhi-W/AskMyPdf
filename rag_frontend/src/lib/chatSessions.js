const CHAT_SESSION_CHANGED_EVENT = "rag-chat-session-changed";
const CHAT_SESSIONS_REFRESH_EVENT = "rag-chat-sessions-refresh";
const STORAGE_PREFIX = "rag-chat-session";
function chatSessionStorageKey(userId) {
  return `${STORAGE_PREFIX}:${userId}`;
}
function getStoredChatSessionId(userId) {
  return window.localStorage.getItem(chatSessionStorageKey(userId));
}
function setStoredChatSessionId(userId, sessionId) {
  window.localStorage.setItem(chatSessionStorageKey(userId), sessionId);
}
function removeStoredChatSessionId(userId) {
  window.localStorage.removeItem(chatSessionStorageKey(userId));
}
function notifyChatSessionChanged(sessionId) {
  window.dispatchEvent(
    new CustomEvent(CHAT_SESSION_CHANGED_EVENT, {
      detail: { sessionId }
    })
  );
}
function notifyChatSessionsRefresh() {
  window.dispatchEvent(new CustomEvent(CHAT_SESSIONS_REFRESH_EVENT));
}
export {
  CHAT_SESSIONS_REFRESH_EVENT,
  CHAT_SESSION_CHANGED_EVENT,
  chatSessionStorageKey,
  getStoredChatSessionId,
  notifyChatSessionChanged,
  notifyChatSessionsRefresh,
  removeStoredChatSessionId,
  setStoredChatSessionId
};
