import { useEffect, useRef } from "react";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import { designTokens } from "@/theme/tokens";

function ChatWorkspace() {
  const {
    messages,
    draft,
    setDraft,
    loading,
    loadingSessions,
    error,
    currentSession,
    userId,
    sendMessage,
  } = useChatContext();
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentSession?.session_id]);

  useEffect(() => {
    if (error) {
      showToast(error, "danger");
    }
  }, [error, showToast]);

  const handleSend = async () => {
    await sendMessage(draft);
    inputRef.current?.focus();
  };

  return (
    <section
      className="chatgpt-shell"
      style={{
        height: "calc(100vh - 3rem)",
        minHeight: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr",
        background: designTokens.colors.surface,
        border: `1px solid ${designTokens.colors.border}`,
        borderRadius: designTokens.radii.lg,
        boxShadow: designTokens.shadow.sm,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          minWidth: 0,
          minHeight: 0,
          background: designTokens.colors.surface,
        }}
      >
        <header
          style={{
            alignItems: "center",
            borderBottom: `1px solid ${designTokens.colors.border}`,
            display: "flex",
            gap: designTokens.spacing.md,
            justifyContent: "space-between",
            minHeight: "4.5rem",
            padding: `${designTokens.spacing.md} ${designTokens.spacing.xl}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: designTokens.spacing.md,
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: designTokens.typography.heading,
                  textTransform: "capitalize",
                }}
              >
                {currentSession?.title ?? "New Chat"}
              </h3>
              <p
                style={{
                  margin: `${designTokens.spacing.xs} 0 0`,
                  color: designTokens.colors.textMuted,
                  fontSize: designTokens.typography.label,
                }}
              >
                User: {userId}
              </p>
            </div>
          </div>
        </header>

        <div
          style={{
            overflowY: "auto",
            padding: `${designTokens.spacing.xl}`,
            minHeight: 0,
          }}
        >
          {loadingSessions && messages.length === 0 ? (
            <div
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: "18rem",
              }}
            >
              <Loader />
            </div>
          ) : messages.length === 0 && !loading ? (
            <div
              style={{
                display: "grid",
                gap: designTokens.spacing.sm,
                alignContent: "center",
                justifyItems: "center",
                textAlign: "center",
                minHeight: "60%",
                color: designTokens.colors.textMuted,
              }}
            >
              <div
                style={{
                  color: designTokens.colors.text,
                  fontSize: "1.35rem",
                  fontWeight: 700,
                }}
              >
                Start a new conversation
              </div>
              <div style={{ maxWidth: "34rem" }}>
                Ask a question and the assistant will retrieve an answer from
                your indexed documents.
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              status={message.status}
            >
              {message.role === "assistant" ? (
                <MarkdownContent content={message.content} />
              ) : (
                message.content
              )}
            </ChatMessage>
          ))}

          {loading ? (
            <ChatMessage role="assistant" content="" timestamp="typing...">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: designTokens.spacing.sm,
                }}
              >
                <Loader />
                <span>Thinking...</span>
              </div>
            </ChatMessage>
          ) : null}

          <div ref={endRef} />
        </div>

        <ChatComposer
          inputRef={inputRef}
          value={draft}
          disabled={loading || loadingSessions}
          onChange={setDraft}
          onSend={handleSend}
        />
      </div>
    </section>
  );
}

export function ChatPage() {
  return (
    <ChatProvider>
      <ChatWorkspace />
    </ChatProvider>
  );
}
