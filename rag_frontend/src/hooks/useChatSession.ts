import { useCallback, useEffect, useMemo, useState } from "react";
import {
  chat,
  createChatSession,
  DEFAULT_USER_ID,
  getChatSession,
} from "@/lib/api";
import {
  CHAT_SESSION_CHANGED_EVENT,
  type ChatSessionChangedDetail,
  getStoredChatSessionId,
  notifyChatSessionsRefresh,
  removeStoredChatSessionId,
  setStoredChatSessionId,
} from "@/lib/chatSessions";
import type { ChatResponse, Source } from "@/types/api";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  status?: "default" | "error";
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageTimestamp(timestamp?: string) {
  if (!timestamp) {
    return formatTimestamp();
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : formatTimestamp(date);
}

function formatSources(sources: Source[] = []) {
  const sourceLabels = sources
    .map((source) => {
      const name = source.source ?? "unknown source";
      return source.page ? `${name}, page ${source.page}` : name;
    })
    .filter(Boolean);

  return sourceLabels.length ? `\n\nSources: ${sourceLabels.join(", ")}` : "";
}

function getAnswer(response: ChatResponse) {
  return (
    response.answer ??
    response.results ??
    response.response ??
    "I could not find an answer for that question."
  );
}

function formatAssistantContent(response: ChatResponse) {
  return `${getAnswer(response)}${formatSources(response.sources ?? [])}`;
}

export function useChatSession() {
  const userId = useMemo(() => DEFAULT_USER_ID, []);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(
    async (nextSessionId: string) => {
      setIsLoadingSession(true);
      setError(null);
      const session = await getChatSession(nextSessionId, userId);
      setStoredChatSessionId(userId, session.session_id);
      setSessionId(session.session_id);
      setDraft("");
      setMessages(
        (session.messages ?? []).map((message) => ({
          id: String(message.id),
          role: message.role,
          content: message.content,
          timestamp: formatMessageTimestamp(message.timestamp),
        })),
      );
      setIsLoadingSession(false);
    },
    [userId],
  );

  const startNewChat = useCallback(() => {
    removeStoredChatSessionId(userId);
    setSessionId(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setIsTyping(false);
    setIsLoadingSession(false);
  }, [userId]);

  const ensureSession = useCallback(
    async (firstQuestion: string) => {
      if (sessionId) {
        return sessionId;
      }

      const session = await createChatSession({
        user_id: userId,
        title: firstQuestion.slice(0, 80) || "New chat",
      });
      setStoredChatSessionId(userId, session.session_id);
      setSessionId(session.session_id);
      notifyChatSessionsRefresh();
      return session.session_id;
    },
    [sessionId, userId],
  );

  useEffect(() => {
    const storedSessionId = getStoredChatSessionId(userId);

    if (!storedSessionId) {
      setIsLoadingSession(false);
      return;
    }

    let isMounted = true;
    void loadSession(storedSessionId)
      .catch(() => {
        removeStoredChatSessionId(userId);
        if (!isMounted) return;
        setSessionId(null);
        setMessages([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loadSession, userId]);

  useEffect(() => {
    const handleSessionChanged = (event: Event) => {
      const { sessionId: nextSessionId } = (
        event as CustomEvent<ChatSessionChangedDetail>
      ).detail;

      if (!nextSessionId) {
        startNewChat();
        return;
      }

      void loadSession(nextSessionId).catch((err) => {
        const message =
          err instanceof Error ? err.message : "Unable to load chat session.";
        setError(message);
        setIsLoadingSession(false);
      });
    };

    window.addEventListener(CHAT_SESSION_CHANGED_EVENT, handleSessionChanged);
    return () => {
      window.removeEventListener(
        CHAT_SESSION_CHANGED_EVENT,
        handleSessionChanged,
      );
    };
  }, [loadSession, startNewChat]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isTyping || isLoadingSession) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        timestamp: formatTimestamp(),
      };

      setMessages((current) => [...current, userMessage]);
      setDraft("");
      setError(null);
      setIsTyping(true);

      try {
        const activeSessionId = await ensureSession(trimmed);
        const response = await chat({
          session_id: activeSessionId,
          user_id: userId,
          question: trimmed,
        });
        const assistantMessage: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: formatAssistantContent(response),
          timestamp: formatTimestamp(),
        };

        setMessages((current) => [...current, assistantMessage]);
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
        setIsTyping(false);
      }
    },
    [ensureSession, isLoadingSession, isTyping, userId],
  );

  return {
    messages,
    draft,
    setDraft,
    isTyping,
    isLoadingSession,
    error,
    sessionId,
    userId,
    sendMessage,
  };
}
