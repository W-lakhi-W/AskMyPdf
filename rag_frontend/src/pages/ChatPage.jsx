import { jsx, jsxs } from "react/jsx-runtime";
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
    sendMessage
  } = useChatContext();
  const endRef = useRef(null);
  const inputRef = useRef(null);
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
  return /* @__PURE__ */ jsx(
    "section",
    {
      className: "chatgpt-shell",
      style: {
        height: "calc(100vh - 3rem)",
        minHeight: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr",
        background: designTokens.colors.surface,
        border: `1px solid ${designTokens.colors.border}`,
        borderRadius: designTokens.radii.lg,
        boxShadow: designTokens.shadow.sm
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            minWidth: 0,
            minHeight: 0,
            background: designTokens.colors.surface
          },
          children: [
            /* @__PURE__ */ jsx(
              "header",
              {
                style: {
                  alignItems: "center",
                  borderBottom: `1px solid ${designTokens.colors.border}`,
                  display: "flex",
                  gap: designTokens.spacing.md,
                  justifyContent: "space-between",
                  minHeight: "4.5rem",
                  padding: `${designTokens.spacing.md} ${designTokens.spacing.xl}`
                },
                children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: designTokens.spacing.md,
                      minWidth: 0
                    },
                    children: /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
                      /* @__PURE__ */ jsx(
                        "h3",
                        {
                          style: {
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: designTokens.typography.heading,
                            textTransform: "capitalize"
                          },
                          children: currentSession?.title ?? "New Chat"
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "p",
                        {
                          style: {
                            margin: `${designTokens.spacing.xs} 0 0`,
                            color: designTokens.colors.textMuted,
                            fontSize: designTokens.typography.label
                          },
                          children: [
                            "User: ",
                            userId
                          ]
                        }
                      )
                    ] })
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  overflowY: "auto",
                  padding: `${designTokens.spacing.xl}`,
                  minHeight: 0
                },
                children: [
                  loadingSessions && messages.length === 0 ? /* @__PURE__ */ jsx(
                    "div",
                    {
                      style: {
                        display: "grid",
                        placeItems: "center",
                        minHeight: "18rem"
                      },
                      children: /* @__PURE__ */ jsx(Loader, {})
                    }
                  ) : messages.length === 0 && !loading ? /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        display: "grid",
                        gap: designTokens.spacing.sm,
                        alignContent: "center",
                        justifyItems: "center",
                        textAlign: "center",
                        minHeight: "60%",
                        color: designTokens.colors.textMuted
                      },
                      children: [
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              color: designTokens.colors.text,
                              fontSize: "1.35rem",
                              fontWeight: 700
                            },
                            children: "Start a new conversation"
                          }
                        ),
                        /* @__PURE__ */ jsx("div", { style: { maxWidth: "34rem" }, children: "Ask a question and the assistant will retrieve an answer from your indexed documents." })
                      ]
                    }
                  ) : null,
                  messages.map((message) => /* @__PURE__ */ jsx(
                    ChatMessage,
                    {
                      role: message.role,
                      content: message.content,
                      timestamp: message.timestamp,
                      status: message.status,
                      children: message.role === "assistant" ? /* @__PURE__ */ jsx(MarkdownContent, { content: message.content }) : message.content
                    },
                    message.id
                  )),
                  loading ? /* @__PURE__ */ jsx(ChatMessage, { role: "assistant", content: "", timestamp: "typing...", children: /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: designTokens.spacing.sm
                      },
                      children: [
                        /* @__PURE__ */ jsx(Loader, {}),
                        /* @__PURE__ */ jsx("span", { children: "Thinking..." })
                      ]
                    }
                  ) }) : null,
                  /* @__PURE__ */ jsx("div", { ref: endRef })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              ChatComposer,
              {
                inputRef,
                value: draft,
                disabled: loading || loadingSessions,
                onChange: setDraft,
                onSend: handleSend
              }
            )
          ]
        }
      )
    }
  );
}
function ChatPage() {
  return /* @__PURE__ */ jsx(ChatProvider, { children: /* @__PURE__ */ jsx(ChatWorkspace, {}) });
}
export {
  ChatPage
};
