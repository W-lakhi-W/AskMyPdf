import logging
from typing import Any

from langchain_chroma import Chroma
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import RETRIEVAL_K
from app.memory.manager import ConversationMemoryManager
from app.models.chat import ChatSession
from app.prompts.chat import build_answer_messages, build_rewrite_messages
from app.rag.answer_guard import remove_unsupported_not_found_continuation
from app.repositories.chat import ChatRepository
from app.rag.vectordb import collection_has_metadata_key

logger = logging.getLogger(__name__)
DEFAULT_SESSION_TITLE = "New Chat"
MAX_GENERATED_TITLE_LENGTH = 40


class ChatService:
    def __init__(
        self,
        repository: ChatRepository,
        memory_manager: ConversationMemoryManager,
        vector_store: Chroma,
        llm: Any,
    ):
        self.repository = repository
        self.memory_manager = memory_manager
        self.vector_store = vector_store
        self.llm = llm

    def create_session(self, user_id: str, title: str | None = None) -> ChatSession:
        title = title or DEFAULT_SESSION_TITLE
        return self.repository.create_session(user_id=user_id, title=title)

    def rename_session(
        self,
        user_id: str,
        session_id: str,
        title: str,
    ) -> ChatSession:
        session = self.repository.rename_session(
            user_id=user_id,
            session_id=session_id,
            title=title.strip(),
        )
        if session is None:
            raise LookupError("Chat session not found.")
        return session

    def answer(self, user_id: str, session_id: str, question: str) -> dict[str, Any]:
        session = self.repository.get_session(user_id=user_id, session_id=session_id)
        if session is None:
            raise LookupError("Chat session not found.")

        history_messages = self.memory_manager.load_recent_messages(user_id, session_id)
        history_text = self.memory_manager.format_history(history_messages)

        rewritten_question = self.rewrite_question(question, history_text)
        logger.info(
            "question_rewritten session_id=%s user_id=%s rewritten_length=%s",
            session_id,
            user_id,
            len(rewritten_question),
        )

        documents = self.retrieve_documents(rewritten_question, user_id=user_id)
        context = "\n\n".join(document.page_content for document in documents)
        if not context:
            context = "No relevant document chunks were retrieved."

        try:
            answer_messages = build_answer_messages(
                history=history_text,
                context=context,
                question=question,
                history_messages=history_messages,
            )
            response = self.llm.invoke(answer_messages)
            answer = remove_unsupported_not_found_continuation(response.content)
            logger.info("llm_response_generated session_id=%s user_id=%s", session_id, user_id)

            self.repository.add_message(session, "user", question)
            self.repository.add_message(session, "assistant", answer)
            if session.title.strip().lower() == DEFAULT_SESSION_TITLE.lower():
                self.repository.rename_session(
                    user_id=user_id,
                    session_id=session_id,
                    title=self.generate_title(question),
                )
        except SQLAlchemyError:
            logger.exception("chat_database_write_failed session_id=%s user_id=%s", session_id, user_id)
            raise
        except Exception:
            logger.exception("chat_response_failed session_id=%s user_id=%s", session_id, user_id)
            raise

        return {
            "session_id": session_id,
            "user_id": user_id,
            "question": question,
            "rewritten_question": rewritten_question,
            "answer": answer,
            "sources": [
                {
                    "page": document.metadata.get("page"),
                    "source": document.metadata.get("source_name")
                    or document.metadata.get("source"),
                    "document_id": document.metadata.get("document_id"),
                }
                for document in documents
            ],
        }

    def rewrite_question(self, question: str, history: str) -> str:
        if history == "No previous conversation.":
            return question
        messages = build_rewrite_messages(history=history, question=question)
        response = self.llm.invoke(messages)
        rewritten = response.content.strip().strip('"')
        return rewritten or question

    @staticmethod
    def generate_title(question: str) -> str:
        title = " ".join(question.split())
        if len(title) <= MAX_GENERATED_TITLE_LENGTH:
            return title or DEFAULT_SESSION_TITLE
        return title[: MAX_GENERATED_TITLE_LENGTH - 1].rstrip() + "..."

    def retrieve_documents(self, rewritten_question: str, user_id: str) -> list:
        try:
            use_user_filter = collection_has_metadata_key(self.vector_store, "user_id")
            search_kwargs: dict[str, Any] = {"k": RETRIEVAL_K}
            if use_user_filter:
                search_kwargs["filter"] = {"user_id": user_id}
            else:
                logger.warning(
                    "legacy_unscoped_vector_index user_id=%s message=%s",
                    user_id,
                    "No user_id metadata found; using unfiltered retrieval.",
                )

            retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs=search_kwargs,
            )
            documents = retriever.invoke(rewritten_question)
            logger.info(
                "retrieval_completed user_id=%s filtered=%s result_count=%s",
                user_id,
                use_user_filter,
                len(documents),
            )
            return documents
        except Exception:
            logger.exception("retrieval_failed user_id=%s", user_id)
            raise
