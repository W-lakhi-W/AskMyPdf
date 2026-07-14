from typing import Any

from fastapi import HTTPException
from langchain_chroma import Chroma

embeddings: Any | None = None
vector_store: Chroma | None = None
llm: Any | None = None


def set_runtime(
    initialized_embeddings: Any,
    initialized_vector_store: Chroma,
    initialized_llm: Any,
) -> None:
    global embeddings, vector_store, llm
    embeddings = initialized_embeddings
    vector_store = initialized_vector_store
    llm = initialized_llm


def require_vector_store() -> Chroma:
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store is not ready.")
    return vector_store


def require_llm() -> Any:
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM is not ready.")
    return llm
