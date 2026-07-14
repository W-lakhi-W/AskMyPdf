import hashlib
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import (
    CHROMA_PATH,
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    EMBEDDING_MODEL,
    PDF_PATH,
    file_digest,
)
from app.rag.vectordb import get_vector_store


def ingest_pdf() -> None:
    if not PDF_PATH.is_file():
        raise FileNotFoundError(f"PDF not found: {PDF_PATH}")

    source_hash = file_digest(PDF_PATH)
    print(f"\n{'='*70}")
    print(f"INGESTION STARTED")
    print(f"{'='*70}")
    print(f"PDF Path: {PDF_PATH}")
    print(f"PDF Hash: {source_hash[:16]}...")
    print(f"Embedding model: {EMBEDDING_MODEL}")
    print(f"Chunk size: {CHUNK_SIZE}, Chunk overlap: {CHUNK_OVERLAP}")

    embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    print(f"✓ Embedding model initialized")

    vector_db = get_vector_store(embedding_model)
    print(f"✓ Vector database initialized at {CHROMA_PATH}")

    metadata = vector_db._collection.metadata or {}
    existing_count = vector_db._collection.count()

    print(f"\nCurrent collection status:")
    print(f"  - Existing vectors: {existing_count}")
    print(f"  - Has metadata: {bool(metadata)}")
    if metadata:
        print(f"  - Source hash: {metadata.get('source_hash', 'N/A')[:16]}...")
        print(f"  - Embedding model: {metadata.get('embedding_model', 'N/A')}")
        print(
            f"  - Chunk size/overlap: {metadata.get('chunk_size', 'N/A')}/{metadata.get('chunk_overlap', 'N/A')}"
        )
        print(f"  - Index complete: {metadata.get('index_complete', False)}")

    index_matches = (
        metadata.get("index_complete")
        and metadata.get("source_hash") == source_hash
        and metadata.get("embedding_model") == EMBEDDING_MODEL
        and metadata.get("chunk_size") == CHUNK_SIZE
        and metadata.get("chunk_overlap") == CHUNK_OVERLAP
    )
    if index_matches:
        print(f"\n✓ Index is up-to-date. Skipping re-ingestion.")
        print(f"✓ Vectors stored: {existing_count}")
        sample = vector_db.get(limit=1, include=["documents"])
        if sample["documents"]:
            print(f"✓ Sample indexed chunk: {sample['documents'][0][:200]}...")
        return
    if existing_count and not metadata:
        print(f"\n⚠ Legacy index detected (no metadata). Recording configuration...")
        vector_db._collection.modify(
            metadata={
                "index_complete": True,
                "source_hash": source_hash,
                "embedding_model": EMBEDDING_MODEL,
                "chunk_size": CHUNK_SIZE,
                "chunk_overlap": CHUNK_OVERLAP,
                "chunk_count": existing_count,
            }
        )
        sample = vector_db.get(limit=1, include=["documents"])
        print(f"✓ Legacy index recorded.")
        print(f"✓ Vectors stored: {existing_count}")
        if sample["documents"]:
            print(f"✓ Sample indexed chunk: {sample['documents'][0][:200]}...")
        return
    if existing_count:
        print(
            f"\n⚠ PDF changed. Deleting {existing_count} old vectors and re-indexing..."
        )
        vector_db.delete_collection()
        vector_db = get_vector_store(embedding_model)

    documents = PyPDFLoader(str(PDF_PATH)).load()
    if not documents:
        raise ValueError(f"No readable pages found in {PDF_PATH}.")
    print(f"\n✓ PDF loaded successfully")
    print(f"  - Pages extracted: {len(documents)}")

    # Show sample content
    total_chars = sum(len(doc.page_content) for doc in documents)
    print(f"  - Total characters: {total_chars}")
    print(f"  - Average chars per page: {total_chars / len(documents):.0f}")
    if documents:
        print(f"  - First page sample: {documents[0].page_content[:200]}...")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(documents)
    print(f"\n✓ Text split into chunks")
    print(f"  - Total chunks (before dedup): {len(chunks)}")

    # Calculate chunk statistics
    chunk_sizes = [len(chunk.page_content) for chunk in chunks]
    if chunk_sizes:
        print(
            f"  - Chunk size stats: min={min(chunk_sizes)}, max={max(chunk_sizes)}, avg={sum(chunk_sizes)/len(chunk_sizes):.0f}"
        )

    unique_chunks = []
    seen_chunks = set()
    for chunk in chunks:
        normalized_text = " ".join(chunk.page_content.split())
        if not normalized_text or normalized_text in seen_chunks:
            continue
        seen_chunks.add(normalized_text)
        unique_chunks.append(chunk)
    chunks = unique_chunks
    print(f"  - Unique chunks (after dedup): {len(chunks)}")
    if chunks:
        print(f"  - First chunk sample: {chunks[0].page_content[:200]}...")
        print(f"  - First chunk metadata: {chunks[0].metadata}")

    chunk_ids = [
        hashlib.sha256(
            f"{source_hash}:{index}:{chunk.page_content}".encode("utf-8")
        ).hexdigest()
        for index, chunk in enumerate(chunks)
    ]

    print(f"\n✓ Generating embeddings and storing vectors...")
    vector_db.add_documents(chunks, ids=chunk_ids)
    vector_db._collection.modify(
        metadata={
            "index_complete": True,
            "source_hash": source_hash,
            "embedding_model": EMBEDDING_MODEL,
            "chunk_size": CHUNK_SIZE,
            "chunk_overlap": CHUNK_OVERLAP,
            "chunk_count": len(chunks),
        }
    )
    stored_count = vector_db._collection.count()
    print(f"  - Vectors stored: {stored_count}")
    if stored_count != len(chunks):
        raise RuntimeError(
            f"Index verification failed: created {len(chunks)} chunks "
            f"but found {stored_count} vectors."
        )

    # Verify by retrieving one document
    test_retrieval = vector_db.get(limit=1, include=["documents", "metadatas"])
    print(f"  - Verification: Successfully retrieved test document")

    print(f"\n{'='*70}")
    print(f"✓ INGESTION COMPLETE AND VERIFIED")
    print(f"{'='*70}")
    print(f"Summary:")
    print(f"  - Pages: {len(documents)}")
    print(f"  - Chunks: {len(chunks)}")
    print(f"  - Vectors: {stored_count}")
    print(f"  - Embedding model: {EMBEDDING_MODEL}")
    print(f"  - Ready for querying")
    print(f"{'='*70}\n")


def main() -> int:
    try:
        ingest_pdf()
    except Exception as error:
        print(f"Ingestion failed: {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
