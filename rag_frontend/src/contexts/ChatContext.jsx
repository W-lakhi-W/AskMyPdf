import { jsx } from "react/jsx-runtime";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  chat,
  createChatSession,
  DEFAULT_USER_ID,
  deleteChatSession,
  getChatSession,
  listChatSessions,
  renameChatSession,
} from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  CHAT_SESSION_CHANGED_EVENT,
  getStoredChatSessionId,
  notifyChatSessionsRefresh,
  removeStoredChatSessionId,
  setStoredChatSessionId,
} from "@/lib/chatSessions";
const ChatContext = createContext(null);
function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function formatTimestamp(timestamp) {
  const date = timestamp ? new Date(timestamp) : /* @__PURE__ */ new Date();
  if (Number.isNaN(date.getTime())) {
    return timestamp ?? "";
  }
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function formatSources(response) {
  const labels = (response.sources ?? [])
    .map((source) => {
      const name = source.source ?? "unknown source";
      return source.page ? `${name}, page ${source.page}` : name;
    })
    .filter(Boolean);
  return labels.length
    ? `

Sources: ${labels.join(", ")}`
    : "";
}
function getAnswer(response) {
  return (
    response.answer ??
    response.results ??
    response.response ??
    "I couldn't find that information in the provided documents."
  );
}
function toUiMessages(messages) {
  return messages.map((message) => ({
    id: String(message.id),
    role: message.role,
    content: message.content,
    timestamp: formatTimestamp(message.timestamp),
  }));
}
function ChatProvider({ children }) {
  const { userId: authUserId } = useAuthContext();
  const userId = useMemo(() => authUserId ?? DEFAULT_USER_ID, [authUserId]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState(null);
  const currentSession = useMemo(
    () =>
      sessions.find((session) => session.session_id === selectedSessionId) ??
      null,
    [selectedSessionId, sessions],
  );
  const refreshSessions = useCallback(async () => {
    const loaded = await listChatSessions(userId);
    setSessions(loaded);
    return loaded;
  }, [userId]);
  const selectSession = useCallback(
    async (sessionId) => {
      setError(null);
      setLoadingSessions(true);
      try {
        const session = await getChatSession(sessionId, userId);
        setSelectedSessionId(session.session_id);
        setStoredChatSessionId(userId, session.session_id);
        setMessages(toUiMessages(session.messages ?? []));
        setDraft("");
      } finally {
        setLoadingSessions(false);
      }
    },
    [userId],
  );
  const createNewChat = useCallback(async () => {
    setError(null);
    const session = await createChatSession({
      user_id: userId,
      title: "New Chat",
    });
    setSessions((current) => [session, ...current]);
    setSelectedSessionId(session.session_id);
    setStoredChatSessionId(userId, session.session_id);
    setMessages([]);
    setDraft("");
    notifyChatSessionsRefresh();
    return;
  }, [userId]);
  const startNewChat = useCallback(() => {
    removeStoredChatSessionId(userId);
    setSelectedSessionId(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setLoading(false);
  }, [userId]);
  useEffect(() => {
    let mounted = true;
    async function loadInitialState() {
      setLoadingSessions(true);
      try {
        const loadedSessions = await refreshSessions();
        if (!mounted) return;
        const storedSessionId = getStoredChatSessionId(userId);
        const initialSession =
          loadedSessions.find(
            (session) => session.session_id === storedSessionId,
          ) ?? loadedSessions[0];
        if (initialSession) {
          await selectSession(initialSession.session_id);
        } else {
          startNewChat();
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load chat sessions.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingSessions(false);
        }
      }
    }
    void loadInitialState();
    return () => {
      mounted = false;
    };
  }, [refreshSessions, selectSession, startNewChat, userId]);
  useEffect(() => {
    const handleSessionChanged = (event) => {
      const { sessionId } = event.detail;
      if (!sessionId) {
        startNewChat();
        return;
      }
      void selectSession(sessionId).catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load chat session.",
        );
      });
    };
    window.addEventListener(CHAT_SESSION_CHANGED_EVENT, handleSessionChanged);
    return () => {
      window.removeEventListener(
        CHAT_SESSION_CHANGED_EVENT,
        handleSessionChanged,
      );
    };
  }, [selectSession, startNewChat]);
  const renameSession = useCallback(
    async (sessionId, title) => {
      const renamed = await renameChatSession(sessionId, {
        user_id: userId,
        title,
      });
      setSessions((current) =>
        current.map((session) =>
          session.session_id === sessionId
            ? { ...session, ...renamed }
            : session,
        ),
      );
    },
    [userId],
  );
  const removeSession = useCallback(
    async (sessionId) => {
      await deleteChatSession(sessionId, userId);
      const remaining = sessions.filter(
        (session) => session.session_id !== sessionId,
      );
      setSessions(remaining);
      if (selectedSessionId === sessionId) {
        const next = remaining[0];
        if (next) {
          await selectSession(next.session_id);
        } else {
          await createNewChat();
        }
      }
    },
    [createNewChat, selectedSessionId, selectSession, sessions, userId],
  );
  const sendMessage = useCallback(
    async (content) => {
      const question = content.trim();
      if (!question || loading) return;
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "user",
          content: question,
          timestamp: formatTimestamp(),
        },
      ]);
      setDraft("");
      setLoading(true);
      setError(null);
      try {
        let activeSessionId = selectedSessionId;
        if (!activeSessionId) {
          const session = await createChatSession({
            user_id: userId,
            title: question.slice(0, 80) || "New Chat",
          });
          activeSessionId = session.session_id;
          setSessions((current) => [session, ...current]);
          setSelectedSessionId(session.session_id);
          setStoredChatSessionId(userId, session.session_id);
          notifyChatSessionsRefresh();
        }
        const response = await chat({
          session_id: activeSessionId,
          user_id: userId,
          question,
        });
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: "assistant",
            content: `${getAnswer(response)}${formatSources(response)}`,
            timestamp: formatTimestamp(),
          },
        ]);
        await refreshSessions();
        notifyChatSessionsRefresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "The assistant could not reply.";
        setError(message);
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: "assistant",
            content: `Error: ${message}`,
            timestamp: formatTimestamp(),
            status: "error",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, refreshSessions, selectedSessionId, userId],
  );
  const value = useMemo(
    () => ({
      userId,
      sessions,
      selectedSessionId,
      currentSession,
      messages,
      draft,
      loading,
      loadingSessions,
      error,
      setDraft,
      createNewChat,
      selectSession,
      sendMessage,
      removeSession,
      renameSession,
    }),
    [
      createNewChat,
      currentSession,
      draft,
      error,
      loading,
      loadingSessions,
      messages,
      removeSession,
      renameSession,
      selectSession,
      selectedSessionId,
      sendMessage,
      sessions,
      userId,
    ],
  );
  return /* @__PURE__ */ jsx(ChatContext.Provider, { value, children });
}
function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used inside ChatProvider");
  }
  return context;
}
export { ChatProvider, useChatContext };
