import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { ChatPage } from "@/pages/ChatPage";
import { IngestPage } from "@/pages/IngestPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { AuthPage } from "@/pages/AuthPage";

function ProtectedApp() {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/ingest" element={<IngestPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="*" element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
