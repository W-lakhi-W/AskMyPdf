import hashlib
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import UserAccount


def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, username: str, password: str) -> UserAccount:
        salt = secrets.token_hex(16)
        user = UserAccount(
            username=username,
            password_salt=salt,
            password_hash=_hash_password(password, salt),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user(self, username: str) -> UserAccount | None:
        statement = select(UserAccount).where(UserAccount.username == username)
        return self.db.execute(statement).scalar_one_or_none()

    def authenticate(self, username: str, password: str) -> UserAccount | None:
        user = self.get_user(username)
        if user is None:
            return None
        if user.password_hash != _hash_password(password, user.password_salt):
            return None
        return user
