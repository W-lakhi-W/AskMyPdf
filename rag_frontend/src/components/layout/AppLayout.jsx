import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  DEFAULT_USER_ID,
  deleteChatSession,
  listChatSessions
} from "@/lib/api";
import {
  CHAT_SESSION_CHANGED_EVENT,
  CHAT_SESSIONS_REFRESH_EVENT,
  getStoredChatSessionId,
  notifyChatSessionChanged,
  removeStoredChatSessionId,
  setStoredChatSessionId
} from "@/lib/chatSessions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { designTokens } from "@/theme/tokens";
import logo from "@/assets/logo.png";
const navItems = [
  { to: "/", label: "Chat" },
  { to: "/ingest", label: "Ingest data" },
  { to: "/documents", label: "Documents" }
];
function AppLayout({ children }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [pendingDeleteSession, setPendingDeleteSession] = useState(null);
  const refreshSessions = useCallback(async () => {
    try {
      const response = await listChatSessions(DEFAULT_USER_ID);
      setSessions(response ?? []);
      setActiveSessionId(getStoredChatSessionId(DEFAULT_USER_ID));
    } catch {
      setSessions([]);
    }
  }, []);
  useEffect(() => {
    setActiveSessionId(getStoredChatSessionId(DEFAULT_USER_ID));
    void refreshSessions();
    window.addEventListener(CHAT_SESSIONS_REFRESH_EVENT, refreshSessions);
    const handleSessionChanged = (event) => {
      const { sessionId } = event.detail;
      setActiveSessionId(sessionId);
    };
    window.addEventListener(CHAT_SESSION_CHANGED_EVENT, handleSessionChanged);
    return () => {
      window.removeEventListener(CHAT_SESSIONS_REFRESH_EVENT, refreshSessions);
      window.removeEventListener(
        CHAT_SESSION_CHANGED_EVENT,
        handleSessionChanged
      );
    };
  }, [refreshSessions]);
  const handleNewChat = () => {
    removeStoredChatSessionId(DEFAULT_USER_ID);
    setActiveSessionId(null);
    notifyChatSessionChanged(null);
    navigate("/");
  };
  const handleSelectSession = (sessionId) => {
    setStoredChatSessionId(DEFAULT_USER_ID, sessionId);
    setActiveSessionId(sessionId);
    notifyChatSessionChanged(sessionId);
    navigate("/");
  };
  const handleDeleteSession = async (session) => {
    await deleteChatSession(session.session_id, DEFAULT_USER_ID);
    setSessions(
      (current) => current.filter((item) => item.session_id !== session.session_id)
    );
    if (activeSessionId === session.session_id) {
      removeStoredChatSessionId(DEFAULT_USER_ID);
      setActiveSessionId(null);
      notifyChatSessionChanged(null);
      navigate("/");
    }
    setPendingDeleteSession(null);
  };
  const confirmDeleteSession = (session) => {
    setPendingDeleteSession(session);
  };
  const cancelDeleteSession = () => {
    setPendingDeleteSession(null);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        height: "100vh",
        background: designTokens.colors.background,
        color: designTokens.colors.text,
        display: "flex",
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ jsxs(
          "aside",
          {
            style: {
              width: "280px",
              minHeight: "100vh",
              borderRight: `1px solid ${designTokens.colors.border}`,
              background: `${designTokens.colors.surface}CC`,
              backdropFilter: "blur(12px)",
              padding: `${designTokens.spacing.xl} ${designTokens.spacing.lg}`,
              display: "flex",
              flexDirection: "column",
              gap: designTokens.spacing.lg
            },
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: designTokens.spacing.sm
                  },
                  children: /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: logo,
                      alt: "Ask my PDF logo",
                      style: { height: 48 }
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsx("nav", { style: { display: "grid", gap: designTokens.spacing.sm }, children: navItems.map((item) => /* @__PURE__ */ jsx(
                NavLink,
                {
                  to: item.to,
                  style: ({ isActive }) => ({
                    padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
                    borderRadius: designTokens.radii.md,
                    background: isActive ? designTokens.colors.primary : "transparent",
                    color: isActive ? designTokens.colors.text : designTokens.colors.textMuted,
                    fontWeight: 600,
                    border: isActive ? `1px solid ${designTokens.colors.primary}` : `1px solid transparent`
                  }),
                  children: item.label
                },
                item.to
              )) }),
              /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.md }, children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleNewChat,
                    style: {
                      width: "100%",
                      padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
                      borderRadius: designTokens.radii.md,
                      border: `1px solid ${designTokens.colors.border}`,
                      background: designTokens.colors.surfaceAlt,
                      color: designTokens.colors.text,
                      cursor: "pointer",
                      fontWeight: 600,
                      textAlign: "left"
                    },
                    children: "New chat"
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      display: "grid",
                      gap: designTokens.spacing.sm,
                      minHeight: 0
                    },
                    children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            color: designTokens.colors.textMuted,
                            fontSize: designTokens.typography.label,
                            fontWeight: 700,
                            textTransform: "capitalize"
                          },
                          children: "Chat history"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            display: "grid",
                            gap: designTokens.spacing.xs,
                            maxHeight: "32vh",
                            overflowY: "auto",
                            paddingRight: designTokens.spacing.xs
                          },
                          children: sessions.length ? sessions.map((session) => {
                            const isActive = activeSessionId === session.session_id;
                            return /* @__PURE__ */ jsxs(
                              "div",
                              {
                                style: {
                                  display: "grid",
                                  gridTemplateColumns: "1fr auto",
                                  alignItems: "center",
                                  gap: designTokens.spacing.xs,
                                  border: `1px solid ${isActive ? designTokens.colors.primary : "transparent"}`,
                                  borderRadius: designTokens.radii.md,
                                  background: isActive ? `${designTokens.colors.primary}22` : "transparent",
                                  overflow: "hidden"
                                },
                                children: [
                                  /* @__PURE__ */ jsx(
                                    "button",
                                    {
                                      type: "button",
                                      onClick: () => handleSelectSession(session.session_id),
                                      title: session.title,
                                      style: {
                                        minWidth: 0,
                                        border: 0,
                                        background: "transparent",
                                        color: isActive ? designTokens.colors.text : designTokens.colors.textMuted,
                                        cursor: "pointer",
                                        padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
                                        textAlign: "left",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                      },
                                      children: session.title || "Untitled chat"
                                    }
                                  ),
                                  /* @__PURE__ */ jsx(
                                    "button",
                                    {
                                      type: "button",
                                      onClick: () => confirmDeleteSession(session),
                                      title: `Delete ${session.title || "chat"}`,
                                      style: {
                                        width: "2rem",
                                        height: "2rem",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid transparent",
                                        borderRadius: designTokens.radii.sm,
                                        background: "transparent",
                                        color: designTokens.colors.textMuted,
                                        cursor: "pointer"
                                      },
                                      children: /* @__PURE__ */ jsx(Trash2, { size: 15 })
                                    }
                                  )
                                ]
                              },
                              session.session_id
                            );
                          }) : /* @__PURE__ */ jsx(
                            "div",
                            {
                              style: {
                                color: designTokens.colors.textMuted,
                                fontSize: designTokens.typography.label
                              },
                              children: "No chats yet"
                            }
                          )
                        }
                      )
                    ]
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "main",
          {
            style: {
              flex: 1,
              minHeight: 0,
              padding: `${designTokens.spacing.xl}`,
              overflowY: "auto"
            },
            children
          }
        ),
        /* @__PURE__ */ jsx(
          Modal,
          {
            open: Boolean(pendingDeleteSession),
            title: "Delete chat",
            onClose: cancelDeleteSession,
            children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: designTokens.spacing.lg }, children: [
              /* @__PURE__ */ jsxs("p", { style: { margin: 0, color: designTokens.colors.textMuted }, children: [
                "Are you sure you want to delete",
                " ",
                pendingDeleteSession?.title || "this chat",
                "? This action cannot be undone."
              ] }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: designTokens.spacing.md
                  },
                  children: [
                    /* @__PURE__ */ jsx(Button, { variant: "secondary", onClick: cancelDeleteSession, children: "Cancel" }),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "danger",
                        onClick: () => pendingDeleteSession ? void handleDeleteSession(pendingDeleteSession) : void 0,
                        children: "Delete"
                      }
                    )
                  ]
                }
              )
            ] })
          }
        )
      ]
    }
  );
}
export {
  AppLayout
};
