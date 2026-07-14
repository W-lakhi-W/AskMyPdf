export type HealthResponse = {
  status: string;
  app: string;
  environment: string;
  vector_store_path: string;
  vector_count: number | null;
};

export type IngestResponse = {
  message: string;
  chunks_added: number;
  source_hash: string;
};

export type QueryRequest = {
  query: string;
};

export type Source = {
  page?: number | null;
  source?: string | null;
  document_id?: string | null;
};

export type QueryResponse = {
  query: string;
  results: string;
  sources: Source[];
};

export type ChatSession = {
  session_id: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
};

export type ChatSessionMessage = {
  id: string | number;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

export type ChatSessionDetail = ChatSession & {
  messages: ChatSessionMessage[];
};

export type CreateChatSessionRequest = {
  user_id: string;
  title?: string;
};

export type ChatRequest = {
  session_id: string;
  user_id: string;
  question: string;
};

export type ChatResponse = {
  session_id?: string;
  user_id?: string;
  question?: string;
  rewritten_question?: string;
  answer?: string;
  results?: string;
  response?: string;
  sources?: Source[];
};

export type RenameChatSessionRequest = {
  user_id: string;
  title: string;
};

export type IngestedPDFsResponse = {
  documents: Array<Record<string, unknown>>;
};

export type DeleteResponse = {
  message: string;
  deleted: boolean;
  filename: string;
};
