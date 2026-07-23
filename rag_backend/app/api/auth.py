import base64
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.schemas import AuthenticatedUser, TokenRequest, TokenResponse
from app.core.config import settings
from app.database.session import get_db
from app.repositories.user import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)
router = APIRouter(prefix="/auth", tags=["auth"])


@dataclass(frozen=True)
class CurrentUser:
    user_id: str


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if not settings.api_key:
        if settings.is_production:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="API_KEY must be configured in production.",
            )
        return

    if x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
        )


def _jwt_secret() -> bytes:
    if settings.jwt_secret_key:
        return settings.jwt_secret_key.get_secret_value().encode("utf-8")
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET_KEY must be configured in production.",
        )
    return b"development-only-change-this-jwt-secret"


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("ascii"))


def _json_dumps(value: dict[str, Any]) -> bytes:
    return json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")


def create_access_token(user_id: str, expires_delta: timedelta | None = None) -> str:
    now = datetime.now(UTC)
    expires_at = now + (
        expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    signing_input = ".".join(
        [
            _base64url_encode(_json_dumps(header)),
            _base64url_encode(_json_dumps(payload)),
        ]
    )
    signature = hmac.new(
        _jwt_secret(),
        signing_input.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{signing_input}.{_base64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        header_segment, payload_segment, signature_segment = token.split(".")
        signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
        expected_signature = hmac.new(
            _jwt_secret(),
            signing_input,
            hashlib.sha256,
        ).digest()
        supplied_signature = _base64url_decode(signature_segment)
        if not hmac.compare_digest(expected_signature, supplied_signature):
            raise ValueError("Invalid token signature.")

        header = json.loads(_base64url_decode(header_segment))
        if header.get("alg") != "HS256" or header.get("typ") != "JWT":
            raise ValueError("Unsupported token header.")

        payload = json.loads(_base64url_decode(payload_segment))
        expires_at = int(payload["exp"])
        if expires_at <= int(datetime.now(UTC).timestamp()):
            raise ValueError("Token has expired.")
        if not payload.get("sub"):
            raise ValueError("Token subject is missing.")
        return payload
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error


def authenticate_user(
    username: str,
    password: str,
    db: Session | None = None,
) -> CurrentUser | None:
    if db is not None:
        repository = UserRepository(db)
        user = repository.authenticate(username, password)
        if user is not None:
            return CurrentUser(user_id=user.username)

    expected_username = settings.jwt_admin_username
    expected_password = settings.jwt_admin_password.get_secret_value()
    if secrets_equal(username, expected_username) and secrets_equal(
        password,
        expected_password,
    ):
        return CurrentUser(user_id=username)
    return None


def register_user(db: Session, username: str, password: str) -> CurrentUser:
    repository = UserRepository(db)
    if repository.get_user(username) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists.",
        )
    user = repository.create_user(username=username, password=password)
    return CurrentUser(user_id=user.username)


def secrets_equal(left: str, right: str) -> bool:
    return hmac.compare_digest(left.encode("utf-8"), right.encode("utf-8"))


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    return CurrentUser(user_id=str(payload["sub"]))


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(
    request: TokenRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = authenticate_user(request.username, request.password, db=db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user.user_id)
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user_id=user.user_id,
    )


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
async def register_for_access_token(
    request: TokenRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = register_user(db, request.username, request.password)
    token = create_access_token(user.user_id)
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user_id=user.user_id,
    )


@router.get("/me", response_model=AuthenticatedUser)
async def read_current_user(
    current_user: CurrentUser = Depends(get_current_user),
) -> AuthenticatedUser:
    return AuthenticatedUser(user_id=current_user.user_id)
