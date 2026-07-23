import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { designTokens } from "@/theme/tokens";
import { useAuthContext } from "@/contexts/AuthContext";

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, error: authError, setError } = useAuthContext();
  const [mode, setMode] = useState(
    location.pathname === "/register" ? "register" : "login",
  );
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const helperText = useMemo(() => {
    return mode === "login"
      ? "Log in with your workspace username and password."
      : "Create a new account to use the RAG workspace.";
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        await login({ username: form.username, password: form.password });
      } else {
        await register({ username: form.username, password: form.password });
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return /* @__PURE__ */ jsx("div", {
    style: {
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: designTokens.colors.background,
      color: designTokens.colors.text,
      padding: designTokens.spacing.xl,
    },
    children: /* @__PURE__ */ jsx("div", {
      style: {
        width: "100%",
        maxWidth: 420,
        display: "grid",
        gap: designTokens.spacing.lg,
        padding: `${designTokens.spacing.xl}`,
        borderRadius: designTokens.radii.lg,
        background: designTokens.colors.surface,
        border: `1px solid ${designTokens.colors.border}`,
        boxShadow: designTokens.shadow.md,
      },
      children: /* @__PURE__ */ jsxs("form", {
        onSubmit: handleSubmit,
        style: { display: "grid", gap: designTokens.spacing.md },
        children: [
          /* @__PURE__ */ jsxs("div", {
            style: { display: "grid", gap: designTokens.spacing.xs },
            children: [
              /* @__PURE__ */ jsx("h1", {
                style: {
                  margin: 0,
                  fontSize: designTokens.typography.heading,
                },
                children: mode === "login" ? "Welcome back" : "Create account",
              }),
              /* @__PURE__ */ jsx("p", {
                style: {
                  margin: 0,
                  color: designTokens.colors.textMuted,
                },
                children: helperText,
              }),
            ],
          }),
          authError
            ? /* @__PURE__ */ jsx(Alert, {
                tone: "danger",
                children: authError,
              })
            : null,
          /* @__PURE__ */ jsx(Input, {
            label: "Username",
            name: "username",
            autoComplete: "username",
            value: form.username,
            onChange: (event) =>
              setForm((current) => ({
                ...current,
                username: event.target.value,
              })),
            placeholder: "enter username",
          }),
          /* @__PURE__ */ jsx(Input, {
            label: "Password",
            type: "password",
            name: "password",
            autoComplete:
              mode === "login" ? "current-password" : "new-password",
            value: form.password,
            onChange: (event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              })),
            placeholder: "enter password",
          }),
          /* @__PURE__ */ jsx(Button, {
            type: "submit",
            fullWidth: true,
            disabled:
              submitting || !form.username.trim() || !form.password.trim(),
            children: submitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account",
          }),
          /* @__PURE__ */ jsx("div", {
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: designTokens.spacing.sm,
              alignItems: "center",
              justifyContent: "center",
              color: designTokens.colors.textMuted,
            },
            children: [
              mode === "login"
                ? "Need an account?"
                : "Already have an account?",
              " ",
              mode === "login" ? (
                <Link
                  to="/register"
                  style={{
                    color: designTokens.colors.primary,
                    fontWeight: 600,
                  }}
                  onClick={() => setMode("register")}
                >
                  Register
                </Link>
              ) : (
                <Link
                  to="/login"
                  style={{
                    color: designTokens.colors.primary,
                    fontWeight: 600,
                  }}
                  onClick={() => setMode("login")}
                >
                  Sign in
                </Link>
              ),
            ],
          }),
        ],
      }),
    }),
  });
}

export { AuthPage };
