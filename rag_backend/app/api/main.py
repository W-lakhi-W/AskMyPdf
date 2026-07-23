import logging
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool

from app.api.auth import CurrentUser, get_current_user, router as auth_router
from app.api.schemas import (
    HealthResponse,
    IngestResponse,
    IngestedPDFsResponse,
    QueryRequest,
    QueryResponse,
    ChunksResponse,
    DeleteResponse,
)
from app.core.config import CHROMA_PATH, settings, ensure_runtime_directories
from app.core.logging import configure_logging
from app.core.runtime import set_runtime
from app.database.session import init_db
from app.rag.embedding import get_embedding_model
from app.rag.llm import llm_model
from app.rag.service import answer_question, ingest_pdf_file
from app.rag.vectordb import (
    get_vector_store,
    get_unique_source_names,
    get_all_chunks,
    delete_vectors_by_source_name,
)
from app.routers import chat_router
from app.utils.file_upload import save_uploaded_file

logger = logging.getLogger(__name__)
embeddings = None
vector_store = None
llm = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embeddings, vector_store, llm
    configure_logging()
    ensure_runtime_directories()
    init_db()
    logger.info("Starting %s in %s", settings.app_name, settings.app_env)
    embeddings = get_embedding_model()
    vector_store = get_vector_store(embeddings)
    llm = llm_model()
    set_runtime(embeddings, vector_store, llm)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(chat_router)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_logging(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", uuid4().hex)
    start = perf_counter()
    response = await call_next(request)
    elapsed_ms = (perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_id=%s method=%s path=%s status=%s elapsed_ms=%.2f",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


def _require_ready() -> None:
    if vector_store is None or llm is None:
        raise HTTPException(status_code=503, detail="Service is not ready.")


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    vector_count = None
    if vector_store is not None:
        vector_count = vector_store._collection.count()
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        environment=settings.app_env,
        vector_store_path=str(CHROMA_PATH),
        vector_count=vector_count,
    )


@app.post(
    "/ingest",
    response_model=IngestResponse,
)
async def ingest_data(
    file: UploadFile = File(...),
    document_id: str | None = Form(default=None),
    current_user: CurrentUser = Depends(get_current_user),
) -> IngestResponse:
    _require_ready()
    try:
        file_path = await run_in_threadpool(save_uploaded_file, file)
        result = await run_in_threadpool(
            ingest_pdf_file,
            file_path,
            file_path.name,
            vector_store,
            current_user.user_id,
            document_id,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        logger.exception("Document ingestion failed")
        raise HTTPException(
            status_code=500, detail="Document ingestion failed."
        ) from error

    return IngestResponse(**result)


@app.post(
    "/query",
    response_model=QueryResponse,
)
async def query_data(
    request: QueryRequest,
    _: CurrentUser = Depends(get_current_user),
) -> QueryResponse:
    _require_ready()
    try:
        result = await run_in_threadpool(
            answer_question, request.query, vector_store, llm
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:
        logger.exception("Query failed")
        raise HTTPException(status_code=500, detail="Query failed.") from error

    return QueryResponse(**result)


@app.get("/documents", response_model=IngestedPDFsResponse)
async def list_documents(
    current_user: CurrentUser = Depends(get_current_user),
) -> IngestedPDFsResponse:
    _require_ready()
    try:
        doc_names = await run_in_threadpool(
            get_unique_source_names,
            vector_store,
            current_user.user_id,
        )
    except Exception as error:
        logger.exception("Failed to retrieve documents")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve documents."
        ) from error

    documents = []
    for name in doc_names:
        documents.append(
            {
                "name": name,
                "view_url": f"/download/{name}",
                "download_url": f"/download/{name}?download=true",
            }
        )

    return IngestedPDFsResponse(documents=documents)


@app.get("/download/{filename}")
async def download_pdf(
    filename: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    from app.core.config import DATA_DIR
    from pathlib import Path

    # Security: prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    doc_names = await run_in_threadpool(
        get_unique_source_names,
        vector_store,
        current_user.user_id,
    )
    if filename not in doc_names:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = Path(DATA_DIR) / "uploads" / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=file_path, filename=filename, media_type="application/pdf")


@app.get("/chunks", response_model=ChunksResponse)
async def list_chunks(
    current_user: CurrentUser = Depends(get_current_user),
) -> ChunksResponse:
    _require_ready()
    try:
        chunks = await run_in_threadpool(
            get_all_chunks,
            vector_store,
            current_user.user_id,
        )
    except Exception as error:
        logger.exception("Failed to retrieve chunks")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve chunks."
        ) from error

    return ChunksResponse(total_chunks=len(chunks), chunks=chunks)


@app.delete("/documents/{filename}", response_model=DeleteResponse)
async def delete_document(
    filename: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> DeleteResponse:
    _require_ready()

    # Security: prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    try:
        deleted_count = await run_in_threadpool(
            delete_vectors_by_source_name,
            vector_store,
            filename,
            current_user.user_id,
        )
    except Exception as error:
        logger.exception("Document deletion failed")
        raise HTTPException(
            status_code=500, detail="Failed to delete document from vector database."
        ) from error

    return DeleteResponse(
        message=f"Deleted {deleted_count} vector chunks for document '{filename}'.",
        deleted=deleted_count > 0,
        filename=filename,
    )
