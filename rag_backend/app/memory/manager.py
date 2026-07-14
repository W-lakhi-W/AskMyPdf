from app.core.config import MAX_HISTORY_MESSAGES
from app.models.chat import ChatMessage
from app.repositories.chat import ChatRepository


class ConversationMemoryManager:
    def __init__(
        self,
        repository: ChatRepository,
        max_messages: int = MAX_HISTORY_MESSAGES,
    ):
        self.repository = repository
        self.max_messages = max_messages

    def load_recent_messages(self, user_id: str, session_id: str) -> list[ChatMessage]:
        return self.repository.get_recent_messages(
            user_id=user_id,
            session_id=session_id,
            limit=self.max_messages,
        )

    @staticmethod
    def format_history(messages: list[ChatMessage]) -> str:
        if not messages:
            return "No previous conversation."
        return "\n".join(
            f"{message.role.title()}: {message.content}" for message in messages
        )
