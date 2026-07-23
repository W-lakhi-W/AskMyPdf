import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentUser,
  getStoredAuthToken,
  getStoredUserId,
  loginUser,
  logoutUser,
  persistAuth,
  registerUser,
  clearStoredAuth,
} from "@/lib/api";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => getStoredUserId());
  const [token, setToken] = useState(() => getStoredAuthToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredAuthToken();
    if (!currentToken) {
      setUserId(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();
      setUserId(response?.user_id ?? getStoredUserId());
      setToken(currentToken);
    } catch (err) {
      clearStoredAuth();
      setUserId(null);
      setToken(null);
      setError(
        err instanceof Error ? err.message : "Unable to validate session.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    setError(null);
    const response = await loginUser(credentials);
    persistAuth(response.access_token, response.user_id);
    setToken(response.access_token);
    setUserId(response.user_id);
    return response;
  }, []);

  const register = useCallback(async (credentials) => {
    setError(null);
    const response = await registerUser(credentials);
    persistAuth(response.access_token, response.user_id);
    setToken(response.access_token);
    setUserId(response.user_id);
    return response;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setToken(null);
    setUserId(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      userId,
      token,
      loading,
      error,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      setError,
    }),
    [error, loading, login, logout, register, token, userId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuthContext };
