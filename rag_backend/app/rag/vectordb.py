from typing import Any

from langchain_chroma import Chroma

from app.core.config import CHROMA_PATH, COLLECTION_NAME


def get_vector_store(embeddings) -> Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=str(CHROMA_PATH),
        embedding_function=embeddings,
    )


def count_vectors(vector_store: Chroma) -> int:
    return vector_store._collection.count()


def get_collection_metadata(vector_store: Chroma) -> dict[str, Any]:
    return vector_store._collection.metadata or {}


def collection_has_metadata_key(vector_store: Chroma, key: str) -> bool:
    results = vector_store.get(limit=1, where={key: {"$ne": ""}}, include=["metadatas"])
    return bool(results.get("ids"))


def delete_vectors_by_source_hash(vector_store: Chroma, source_hash: str) -> int:
    matching_ids = vector_store.get(where={"source_hash": source_hash}, include=[]).get(
        "ids", []
    )
    if matching_ids:
        vector_store.delete(ids=matching_ids)
    return len(matching_ids)


def delete_vectors_by_source_name(vector_store: Chroma, source_name: str) -> int:
    matching_ids = vector_store.get(where={"source_name": source_name}, include=[]).get(
        "ids", []
    )
    if matching_ids:
        vector_store.delete(ids=matching_ids)
    return len(matching_ids)


def get_unique_source_names(vector_store: Chroma) -> list[str]:
    try:
        results = vector_store.get(include=["metadatas"])
        metadatas = results.get("metadatas", [])

        if not metadatas:
            return []

        unique_sources = set()
        for metadata in metadatas:
            if metadata and "source_name" in metadata:
                unique_sources.add(metadata["source_name"])

        return sorted(list(unique_sources))
    except Exception as e:
        print(f"Error retrieving source names: {e}")
        return []


def get_all_chunks(vector_store: Chroma) -> list[dict[str, Any]]:
    try:
        results = vector_store.get(include=["documents", "metadatas"])
        documents = results.get("documents", [])
        metadatas = results.get("metadatas", [])

        chunks = []
        for i, doc in enumerate(documents):
            metadata = metadatas[i] if i < len(metadatas) else {}
            chunks.append(
                {
                    "content": doc,
                    "page": metadata.get("page"),
                    "source_name": metadata.get("source_name"),
                    "source_hash": metadata.get("source_hash"),
                    "user_id": metadata.get("user_id"),
                    "document_id": metadata.get("document_id"),
                }
            )
        return chunks
    except Exception as e:
        print(f"Error retrieving chunks: {e}")
        return []
