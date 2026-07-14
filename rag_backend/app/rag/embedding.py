from langchain_huggingface import HuggingFaceEmbeddings

from app.core.config import EMBEDDING_MODEL


def get_embedding_model():
    """
    Load and return the configured embedding model.
    """

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={
            "device": "cpu",
        },
        encode_kwargs={
            "normalize_embeddings": True,
        },
    )

    return embeddings
