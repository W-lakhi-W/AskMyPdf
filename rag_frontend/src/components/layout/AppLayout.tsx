import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  DEFAULT_USER_ID,
  deleteChatSession,
  listChatSessions,
} from "@/lib/api";
import {
  CHAT_SESSION_CHANGED_EVENT,
  CHAT_SESSIONS_REFRESH_EVENT,
  type ChatSessionChangedDetail,
  getStoredChatSessionId,
  notifyChatSessionChanged,
  removeStoredChatSessionId,
  setStoredChatSessionId,
} from "@/lib/chatSessions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { designTokens } from "@/theme/tokens";
import logo from "@/assets/logo.png";
import type { ChatSession } from "@/types/api";

type AppLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { to: "/", label: "Chat" },
  { to: "/ingest", label: "Ingest data" },
  { to: "/documents", label: "Documents" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pendingDeleteSession, setPendingDeleteSession] =
    useState<ChatSession | null>(null);

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
    const handleSessionChanged = (event: Event) => {
      const { sessionId } = (event as CustomEvent<ChatSessionChangedDetail>)
        .detail;
      setActiveSessionId(sessionId);
    };
    window.addEventListener(CHAT_SESSION_CHANGED_EVENT, handleSessionChanged);
    return () => {
      window.removeEventListener(CHAT_SESSIONS_REFRESH_EVENT, refreshSessions);
      window.removeEventListener(
        CHAT_SESSION_CHANGED_EVENT,
        handleSessionChanged,
      );
    };
  }, [refreshSessions]);

  const handleNewChat = () => {
    removeStoredChatSessionId(DEFAULT_USER_ID);
    setActiveSessionId(null);
    notifyChatSessionChanged(null);
    navigate("/");
  };

  const handleSelectSession = (sessionId: string) => {
    setStoredChatSessionId(DEFAULT_USER_ID, sessionId);
    setActiveSessionId(sessionId);
    notifyChatSessionChanged(sessionId);
    navigate("/");
  };

  const handleDeleteSession = async (session: ChatSession) => {
    await deleteChatSession(session.session_id, DEFAULT_USER_ID);
    setSessions((current) =>
      current.filter((item) => item.session_id !== session.session_id),
    );

    if (activeSessionId === session.session_id) {
      removeStoredChatSessionId(DEFAULT_USER_ID);
      setActiveSessionId(null);
      notifyChatSessionChanged(null);
      navigate("/");
    }

    setPendingDeleteSession(null);
  };

  const confirmDeleteSession = (session: ChatSession) => {
    setPendingDeleteSession(session);
  };

  const cancelDeleteSession = () => {
    setPendingDeleteSession(null);
  };

  return (
    <div
      style={{
        height: "100vh",
        background: designTokens.colors.background,
        color: designTokens.colors.text,
        display: "flex",
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          width: "280px",
          minHeight: "100vh",
          borderRight: `1px solid ${designTokens.colors.border}`,
          background: `${designTokens.colors.surface}CC`,
          backdropFilter: "blur(12px)",
          padding: `${designTokens.spacing.xl} ${designTokens.spacing.lg}`,
          display: "flex",
          flexDirection: "column",
          gap: designTokens.spacing.lg,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: designTokens.spacing.sm,
          }}
        >
          <img
            src={logo}
            alt="Ask my PDF logo"
            style={{ height: 48 }}
          />
        </div>

        <nav style={{ display: "grid", gap: designTokens.spacing.sm }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
                borderRadius: designTokens.radii.md,
                background: isActive
                  ? designTokens.colors.primary
                  : "transparent",
                color: isActive
                  ? designTokens.colors.text
                  : designTokens.colors.textMuted,
                fontWeight: 600,
                border: isActive
                  ? `1px solid ${designTokens.colors.primary}`
                  : `1px solid transparent`,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: "grid", gap: designTokens.spacing.md }}>
          <button
            type="button"
            onClick={handleNewChat}
            style={{
              width: "100%",
              padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
              borderRadius: designTokens.radii.md,
              border: `1px solid ${designTokens.colors.border}`,
              background: designTokens.colors.surfaceAlt,
              color: designTokens.colors.text,
              cursor: "pointer",
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            New chat
          </button>

          <div
            style={{
              display: "grid",
              gap: designTokens.spacing.sm,
              minHeight: 0,
            }}
          >
            <div
              style={{
                color: designTokens.colors.textMuted,
                fontSize: designTokens.typography.label,
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              Chat history
            </div>
            <div
              style={{
                display: "grid",
                gap: designTokens.spacing.xs,
                maxHeight: "32vh",
                overflowY: "auto",
                paddingRight: designTokens.spacing.xs,
              }}
            >
              {sessions.length ? (
                sessions.map((session) => {
                  const isActive = activeSessionId === session.session_id;

                  return (
                    <div
                      key={session.session_id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "center",
                        gap: designTokens.spacing.xs,
                        border: `1px solid ${
                          isActive ? designTokens.colors.primary : "transparent"
                        }`,
                        borderRadius: designTokens.radii.md,
                        background: isActive
                          ? `${designTokens.colors.primary}22`
                          : "transparent",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectSession(session.session_id)}
                        title={session.title}
                        style={{
                          minWidth: 0,
                          border: 0,
                          background: "transparent",
                          color: isActive
                            ? designTokens.colors.text
                            : designTokens.colors.textMuted,
                          cursor: "pointer",
                          padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
                          textAlign: "left",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {session.title || "Untitled chat"}
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteSession(session)}
                        title={`Delete ${session.title || "chat"}`}
                        style={{
                          width: "2rem",
                          height: "2rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid transparent",
                          borderRadius: designTokens.radii.sm,
                          background: "transparent",
                          color: designTokens.colors.textMuted,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    color: designTokens.colors.textMuted,
                    fontSize: designTokens.typography.label,
                  }}
                >
                  No chats yet
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: `${designTokens.spacing.xl}`,
          overflowY: "auto",
        }}
      >
        {children}
      </main>

      <Modal
        open={Boolean(pendingDeleteSession)}
        title="Delete chat"
        onClose={cancelDeleteSession}
      >
        <div style={{ display: "grid", gap: designTokens.spacing.lg }}>
          <p style={{ margin: 0, color: designTokens.colors.textMuted }}>
            Are you sure you want to delete{" "}
            {pendingDeleteSession?.title || "this chat"}? This action cannot be
            undone.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: designTokens.spacing.md,
            }}
          >
            <Button variant="secondary" onClick={cancelDeleteSession}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                pendingDeleteSession
                  ? void handleDeleteSession(pendingDeleteSession)
                  : undefined
              }
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
