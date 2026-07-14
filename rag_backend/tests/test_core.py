import io
import unittest

from fastapi import UploadFile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.session import Base
from app.memory.manager import ConversationMemoryManager
from app.repositories.chat import ChatRepository
from app.rag.answer_guard import (
    NOT_FOUND_ANSWER,
    remove_unsupported_not_found_continuation,
)
from app.rag.service import chunk_id
from app.rag.vectordb import delete_vectors_by_source_name
from app.services.chat import ChatService
from app.utils.file_upload import save_uploaded_file


class CoreTests(unittest.TestCase):
    def test_chunk_id_is_stable(self):
        first = chunk_id("abc", 1, "hello")
        second = chunk_id("abc", 1, "hello")
        different = chunk_id("abc", 2, "hello")

        self.assertEqual(first, second)
        self.assertNotEqual(first, different)

    def test_upload_rejects_non_pdf(self):
        upload = UploadFile(filename="bad.txt", file=io.BytesIO(b"nope"))

        with self.assertRaises(ValueError):
            save_uploaded_file(upload)

    def test_delete_vectors_by_source_name_removes_matching_chunk_ids(self):
        class FakeVectorStore:
            def __init__(self):
                self.deleted_ids = None
                self.deleted_where = None

            def get(self, where=None, include=None):
                self.last_where = where
                self.last_include = include
                return {"ids": ["chunk-1", "chunk-2"]}

            def delete(self, ids=None, where=None):
                self.deleted_ids = ids
                self.deleted_where = where

        store = FakeVectorStore()

        deleted = delete_vectors_by_source_name(store, "sample.pdf")

        self.assertEqual(deleted, 2)
        self.assertEqual(store.deleted_ids, ["chunk-1", "chunk-2"])
        self.assertIsNone(store.deleted_where)

    def test_chat_repository_isolates_sessions_by_user(self):
        db = make_test_db()
        repository = ChatRepository(db)
        session = repository.create_session("user-a", "Project chat")
        repository.add_message(session, "user", "hello")

        self.assertIsNotNone(repository.get_session("user-a", session.session_id))
        self.assertIsNone(repository.get_session("user-b", session.session_id))

    def test_memory_manager_returns_recent_messages_only(self):
        db = make_test_db()
        repository = ChatRepository(db)
        session = repository.create_session("user-a", "Project chat")
        for index in range(5):
            repository.add_message(session, "user", f"message {index}")

        memory = ConversationMemoryManager(repository, max_messages=2)
        messages = memory.load_recent_messages("user-a", session.session_id)

        self.assertEqual([message.content for message in messages], ["message 3", "message 4"])

    def test_chat_service_rewrites_retrieves_and_saves_messages(self):
        db = make_test_db()
        repository = ChatRepository(db)
        session = repository.create_session("user-a", "History chat")
        repository.add_message(session, "user", "Who is Napoleon?")
        repository.add_message(session, "assistant", "Napoleon Bonaparte was Emperor of France.")

        llm = FakeLLM()
        vector_store = FakeVectorStore()
        service = ChatService(
            repository=repository,
            memory_manager=ConversationMemoryManager(repository, max_messages=10),
            vector_store=vector_store,
            llm=llm,
        )

        result = service.answer("user-a", session.session_id, "When was he born?")
        messages = repository.get_recent_messages("user-a", session.session_id, 10)

        self.assertEqual(result["rewritten_question"], "When was Napoleon Bonaparte born?")
        self.assertEqual(vector_store.last_query, "When was Napoleon Bonaparte born?")
        self.assertEqual(vector_store.search_kwargs, {"k": 5})
        self.assertEqual(result["answer"], "Napoleon was born in 1769.")
        self.assertEqual(messages[-2].content, "When was he born?")
        self.assertEqual(messages[-1].content, "Napoleon was born in 1769.")

    def test_answer_prompt_sends_history_as_chat_messages(self):
        db = make_test_db()
        repository = ChatRepository(db)
        session = repository.create_session("user-a", "Memory chat")
        repository.add_message(session, "user", "What is FastAPI?")
        repository.add_message(session, "assistant", "FastAPI is a Python web framework.")

        llm = RecordingLLM()
        service = ChatService(
            repository=repository,
            memory_manager=ConversationMemoryManager(repository, max_messages=10),
            vector_store=FakeVectorStore(),
            llm=llm,
        )

        service.answer("user-a", session.session_id, "What did I ask before?")

        answer_messages = llm.calls[-1]
        message_text = [message.content for message in answer_messages]
        self.assertIn("What is FastAPI?", message_text)
        self.assertIn("FastAPI is a Python web framework.", message_text)

    def test_chat_service_filters_when_user_metadata_exists(self):
        db = make_test_db()
        repository = ChatRepository(db)
        session = repository.create_session("user-a", "Filtered chat")

        vector_store = FakeVectorStore(has_user_metadata=True)
        service = ChatService(
            repository=repository,
            memory_manager=ConversationMemoryManager(repository, max_messages=10),
            vector_store=vector_store,
            llm=NoRewriteLLM(),
        )

        service.answer("user-a", session.session_id, "What is indexed?")

        self.assertEqual(
            vector_store.search_kwargs,
            {"k": 5, "filter": {"user_id": "user-a"}},
        )

    def test_chat_service_auto_titles_new_chat_after_first_message(self):
        db = make_test_db()
        repository = ChatRepository(db)
        session = repository.create_session("user-a", "New Chat")
        service = ChatService(
            repository=repository,
            memory_manager=ConversationMemoryManager(repository, max_messages=10),
            vector_store=FakeVectorStore(),
            llm=NoRewriteLLM(),
        )

        service.answer("user-a", session.session_id, "Explain machine learning in simple terms")
        updated = repository.get_session("user-a", session.session_id)

        self.assertIsNotNone(updated)
        self.assertEqual(updated.title, "Explain machine learning in simple terms")

    def test_chat_repository_renames_session_for_owner_only(self):
        db = make_test_db()
        repository = ChatRepository(db)
        session = repository.create_session("user-a", "New Chat")

        renamed = repository.rename_session("user-a", session.session_id, "Renamed")
        denied = repository.rename_session("user-b", session.session_id, "Other")

        self.assertIsNotNone(renamed)
        self.assertIsNone(denied)
        self.assertEqual(renamed.title, "Renamed")

    def test_answer_guard_removes_external_knowledge_after_not_found(self):
        answer = (
            "Based on the provided document context, I couldn't find that "
            "information in the provided documents.\n\nHowever, I can tell you "
        )

        self.assertEqual(
            remove_unsupported_not_found_continuation(answer),
            NOT_FOUND_ANSWER,
        )

    def test_chat_service_saves_guarded_not_found_answer(self):
        db = make_test_db()
        repository = ChatRepository(db)
        session = repository.create_session("user-a", "Guard chat")

        service = ChatService(
            repository=repository,
            memory_manager=ConversationMemoryManager(repository, max_messages=10),
            vector_store=FakeVectorStore(),
            llm=LeakyNotFoundLLM(),
        )

        result = service.answer("user-a", session.session_id, "Tell me about Shivaji College")
        messages = repository.get_recent_messages("user-a", session.session_id, 10)

        self.assertEqual(result["answer"], NOT_FOUND_ANSWER)
        self.assertEqual(messages[-1].content, NOT_FOUND_ANSWER)


def make_test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return TestingSession()


class FakeResponse:
    def __init__(self, content):
        self.content = content


class FakeLLM:
    def __init__(self):
        self.calls = 0

    def invoke(self, messages):
        self.calls += 1
        if self.calls == 1:
            return FakeResponse("When was Napoleon Bonaparte born?")
        return FakeResponse("Napoleon was born in 1769.")


class RecordingLLM:
    def __init__(self):
        self.calls = []

    def invoke(self, messages):
        self.calls.append(messages)
        if len(self.calls) == 1:
            return FakeResponse("What did I ask before?")
        return FakeResponse("You asked: What is FastAPI?")


class NoRewriteLLM:
    def invoke(self, messages):
        return FakeResponse("Answer from indexed document.")


class LeakyNotFoundLLM:
    def invoke(self, messages):
        return FakeResponse(
            "I couldn't find that information in the provided documents.\n\n"
        )


class FakeDocument:
    page_content = "Napoleon Bonaparte was born in 1769."
    metadata = {"page": 1, "source_name": "napoleon.pdf", "document_id": "doc-1"}


class FakeRetriever:
    def __init__(self, vector_store):
        self.vector_store = vector_store

    def invoke(self, query):
        self.vector_store.last_query = query
        return [FakeDocument()]


class FakeVectorStore:
    def __init__(self, has_user_metadata=False):
        self.last_query = None
        self.search_kwargs = None
        self.has_user_metadata = has_user_metadata

    def get(self, limit=None, where=None, include=None):
        return {"ids": ["chunk-1"] if self.has_user_metadata else []}

    def as_retriever(self, search_type=None, search_kwargs=None):
        self.search_kwargs = search_kwargs
        return FakeRetriever(self)


if __name__ == "__main__":
    unittest.main()
