import logging

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.chat import ChatMessage, ChatSession, utc_now

logger = logging.getLogger(__name__)


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, user_id: str, title: str) -> ChatSession:
        session = ChatSession(user_id=user_id, title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        logger.info("chat_session_created session_id=%s user_id=%s", session.session_id, user_id)
        return session

    def list_sessions(self, user_id: str) -> list[ChatSession]:
        statement = (
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_session(self, user_id: str, session_id: str) -> ChatSession | None:
        statement = (
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(
                ChatSession.user_id == user_id,
                ChatSession.session_id == session_id,
            )
        )
        return self.db.scalars(statement).first()

    def delete_session(self, user_id: str, session_id: str) -> bool:
        session = self.get_session(user_id, session_id)
        if session is None:
            return False
        self.db.delete(session)
        self.db.commit()
        logger.info("chat_session_deleted session_id=%s user_id=%s", session_id, user_id)
        return True

    def rename_session(
        self,
        user_id: str,
        session_id: str,
        title: str,
    ) -> ChatSession | None:
        session = self.get_session(user_id, session_id)
        if session is None:
            return None

        session.title = title
        session.updated_at = utc_now()
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        logger.info("chat_session_renamed session_id=%s user_id=%s", session_id, user_id)
        return session

    def add_message(self, session: ChatSession, role: str, content: str) -> ChatMessage:
        message = ChatMessage(session_id=session.session_id, role=role, content=content)
        session.updated_at = utc_now()
        self.db.add(message)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_recent_messages(
        self,
        user_id: str,
        session_id: str,
        limit: int,
    ) -> list[ChatMessage]:
        if self.get_session(user_id, session_id) is None:
            return []

        statement = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.timestamp.desc())
            .limit(limit)
        )
        return list(reversed(self.db.scalars(statement).all()))
