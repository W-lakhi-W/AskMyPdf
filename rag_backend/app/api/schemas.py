from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    app: str
    environment: str
    vector_store_path: str
    vector_count: int | None = None


class IngestResponse(BaseModel):
    message: str
    chunks_added: int
    source_hash: str


class QueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)


class Source(BaseModel):
    page: int | None = None
    source: str | None = None


class QueryResponse(BaseModel):
    query: str
    results: str
    sources: list[Source]


class IngestedPDFsResponse(BaseModel):
    documents: list[dict]


class DocumentInfo(BaseModel):
    name: str
    view_url: str
    download_url: str


class ChunkInfo(BaseModel):
    content: str
    page: int | None = None
    source_name: str | None = None
    source_hash: str | None = None
    user_id: str | None = None
    document_id: str | None = None


class ChunksResponse(BaseModel):
    total_chunks: int
    chunks: list[ChunkInfo]


class DeleteRequest(BaseModel):
    filename: str = Field(min_length=1)


class DeleteResponse(BaseModel):
    message: str
    deleted: bool
    filename: str


class ChatSessionCreate(BaseModel):
    user_id: str = Field(default="default-user", min_length=1, max_length=128)
    title: str | None = Field(default=None, max_length=200)


class ChatSessionRename(BaseModel):
    user_id: str = Field(default="default-user", min_length=1, max_length=128)
    title: str = Field(min_length=1, max_length=200)


class ChatSessionSummary(BaseModel):
    session_id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    timestamp: str


class ChatSessionDetail(ChatSessionSummary):
    messages: list[ChatMessageResponse]


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1)
    user_id: str = Field(default="default-user", min_length=1, max_length=128)
    question: str = Field(min_length=1, max_length=2000)


class ChatSource(BaseModel):
    page: int | None = None
    source: str | None = None
    document_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    user_id: str
    question: str
    rewritten_question: str
    answer: str
    sources: list[ChatSource]
