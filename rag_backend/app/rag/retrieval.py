from app.rag.embedding import get_embedding_model
from app.rag.vectordb import get_vector_store

vector_store = get_vector_store(embeddings=get_embedding_model())
retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": 4
        }
    )

def retrieve_documents(query: str):
    """
    Retrieve documents from the vector store based on the query.

    Args:
        query (str): The query string to search for relevant documents.

    Returns:
        List[Document]: A list of retrieved documents.
    """

    return retriever.invoke(query)


def retrive_documents(query: str):
    return retrieve_documents(query)
