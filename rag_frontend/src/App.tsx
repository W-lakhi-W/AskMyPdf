import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatPage } from "@/pages/ChatPage";
import { IngestPage } from "@/pages/IngestPage";
import { DocumentsPage } from "@/pages/DocumentsPage";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/ingest" element={<IngestPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
