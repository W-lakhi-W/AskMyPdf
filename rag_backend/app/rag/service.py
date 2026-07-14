import hashlib
from pathlib import Path
from typing import Any

from langchain_chroma import Chroma

from app.core.config import RETRIEVAL_K, file_digest
from app.rag.answer_guard import remove_unsupported_not_found_continuation
from app.rag.loader import load_pdf
from app.rag.prompt import rag_prompt
from app.rag.splitter import split_documents


def chunk_id(source_hash: str, index: int, content: str) -> str:
    return hashlib.sha256(
        f"{source_hash}:{index}:{content}".encode("utf-8")
    ).hexdigest()


def ingest_pdf_file(
    file_path: Path,
    original_name: str,
    vector_store: Chroma,
    user_id: str | None = None,
    document_id: str | None = None,
) -> dict[str, Any]:
    source_hash = file_digest(file_path)
    documents = load_pdf(str(file_path))
    chunks = split_documents(documents)

    unique_chunks = []
    seen_text = set()
    for chunk in chunks:
        normalized_text = " ".join(chunk.page_content.split())
        if not normalized_text or normalized_text in seen_text:
            continue
        seen_text.add(normalized_text)
        chunk.metadata["source_hash"] = source_hash
        chunk.metadata["source_name"] = Path(original_name or file_path.name).name
        if user_id:
            chunk.metadata["user_id"] = user_id
        if document_id:
            chunk.metadata["document_id"] = document_id
        unique_chunks.append(chunk)

    if not unique_chunks:
        raise ValueError("No readable text found in the uploaded PDF.")

    old_ids = vector_store.get(
        where={"source_hash": source_hash},
        include=[],
    ).get("ids", [])
    if old_ids:
        vector_store.delete(ids=old_ids)

    ids = [
        chunk_id(source_hash, index, chunk.page_content)
        for index, chunk in enumerate(unique_chunks)
    ]
    vector_store.add_documents(unique_chunks, ids=ids)

    return {
        "message": "Document ingested successfully",
        "chunks_added": len(unique_chunks),
        "source_hash": source_hash,
    }


def answer_question(query: str, vector_store: Chroma, llm: Any) -> dict[str, Any]:
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": RETRIEVAL_K},
    )
    documents = retriever.invoke(query)
    if not documents:
        raise LookupError("No relevant documents found.")

    context = "\n\n".join(doc.page_content for doc in documents)
    messages = rag_prompt.invoke({"context": context, "question": query})
    response = llm.invoke(messages)
    answer = remove_unsupported_not_found_continuation(response.content)

    return {
        "query": query,
        "results": answer,
        "sources": [
            {
                "page": doc.metadata.get("page"),
                "source": doc.metadata.get("source_name") or doc.metadata.get("source"),
            }
            for doc in documents
        ],
    }
