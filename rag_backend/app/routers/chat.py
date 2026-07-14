import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.auth import require_api_key
from app.api.schemas import (
    ChatRequest,
    ChatResponse,
    ChatSessionCreate,
    ChatSessionDetail,
    ChatSessionRename,
    ChatSessionSummary,
)
from app.core.runtime import require_llm, require_vector_store
from app.database.session import get_db
from app.memory.manager import ConversationMemoryManager
from app.models.chat import ChatMessage, ChatSession
from app.repositories.chat import ChatRepository
from app.services.chat import ChatService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"], dependencies=[Depends(require_api_key)])


def _session_summary(session: ChatSession) -> ChatSessionSummary:
    return ChatSessionSummary(
        session_id=session.session_id,
        user_id=session.user_id,
        title=session.title,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


def _message_response(message: ChatMessage) -> dict:
    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "timestamp": message.timestamp.isoformat(),
    }


def get_chat_service(db: Session = Depends(get_db)) -> ChatService:
    repository = ChatRepository(db)
    memory_manager = ConversationMemoryManager(repository)
    return ChatService(
        repository=repository,
        memory_manager=memory_manager,
        vector_store=require_vector_store(),
        llm=require_llm(),
    )


@router.post("/session", response_model=ChatSessionSummary, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    request: ChatSessionCreate,
    service: ChatService = Depends(get_chat_service),
) -> ChatSessionSummary:
    try:
        session = service.create_session(user_id=request.user_id, title=request.title)
    except SQLAlchemyError as error:
        logger.exception("chat_session_create_failed user_id=%s", request.user_id)
        raise HTTPException(status_code=500, detail="Failed to create chat session.") from error
    return _session_summary(session)


@router.get("/sessions", response_model=list[ChatSessionSummary])
async def list_chat_sessions(
    user_id: str = Query(default="default-user", min_length=1, max_length=128),
    db: Session = Depends(get_db),
) -> list[ChatSessionSummary]:
    try:
        sessions = ChatRepository(db).list_sessions(user_id)
    except SQLAlchemyError as error:
        logger.exception("chat_session_list_failed user_id=%s", user_id)
        raise HTTPException(status_code=500, detail="Failed to list chat sessions.") from error
    return [_session_summary(session) for session in sessions]


@router.get("/session/{session_id}", response_model=ChatSessionDetail)
async def get_chat_session(
    session_id: str,
    user_id: str = Query(default="default-user", min_length=1, max_length=128),
    db: Session = Depends(get_db),
) -> ChatSessionDetail:
    session = ChatRepository(db).get_session(user_id=user_id, session_id=session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found.")

    summary = _session_summary(session).model_dump()
    return ChatSessionDetail(
        **summary,
        messages=[_message_response(message) for message in session.messages],
    )


@router.patch("/session/{session_id}", response_model=ChatSessionSummary)
async def rename_chat_session(
    session_id: str,
    request: ChatSessionRename,
    service: ChatService = Depends(get_chat_service),
) -> ChatSessionSummary:
    try:
        session = service.rename_session(
            user_id=request.user_id,
            session_id=session_id,
            title=request.title,
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SQLAlchemyError as error:
        logger.exception(
            "chat_session_rename_failed session_id=%s user_id=%s",
            session_id,
            request.user_id,
        )
        raise HTTPException(status_code=500, detail="Failed to rename chat session.") from error
    return _session_summary(session)


@router.delete("/session/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: str,
    user_id: str = Query(default="default-user", min_length=1, max_length=128),
    db: Session = Depends(get_db),
) -> None:
    try:
        deleted = ChatRepository(db).delete_session(user_id=user_id, session_id=session_id)
    except SQLAlchemyError as error:
        logger.exception("chat_session_delete_failed session_id=%s user_id=%s", session_id, user_id)
        raise HTTPException(status_code=500, detail="Failed to delete chat session.") from error
    if not deleted:
        raise HTTPException(status_code=404, detail="Chat session not found.")


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    service: ChatService = Depends(get_chat_service),
) -> ChatResponse:
    try:
        result = service.answer(
            user_id=request.user_id,
            session_id=request.session_id,
            question=request.question,
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except SQLAlchemyError as error:
        logger.exception("chat_database_failed session_id=%s user_id=%s", request.session_id, request.user_id)
        raise HTTPException(status_code=500, detail="Failed to save chat messages.") from error
    except Exception as error:
        logger.exception("chat_failed session_id=%s user_id=%s", request.session_id, request.user_id)
        raise HTTPException(status_code=500, detail="Chat request failed.") from error

    return ChatResponse(**result)
