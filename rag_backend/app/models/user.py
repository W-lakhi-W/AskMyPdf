from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserAccount(Base):
    __tablename__ = "user_accounts"
    __table_args__ = (UniqueConstraint("username", name="uq_user_accounts_username"),)

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    username: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    password_salt: Mapped[str] = mapped_column(String(32), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
