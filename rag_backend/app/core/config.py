import hashlib
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DOCUMENTS_DIR = DATA_DIR / "documents"
VECTORSTORES_DIR = DATA_DIR / "vectorstores"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "RAG Document QA"
    app_env: str = "development"
    log_level: str = "INFO"

    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    api_key: str = Field(default="", alias="API_KEY")
    jwt_secret_key: SecretStr | None = Field(default=None, alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=60,
        alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    jwt_admin_username: str = Field(default="admin", alias="JWT_ADMIN_USERNAME")
    jwt_admin_password: SecretStr = Field(
        default=SecretStr("admin"),
        alias="JWT_ADMIN_PASSWORD",
    )

    pdf_path: Path = DOCUMENTS_DIR / "sample.pdf"
    chroma_path: Path = VECTORSTORES_DIR / "chroma_db"
    collection_name: str = "langchain"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    llm_model: str = "llama-3.3-70b-versatile"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_k: int = Field(default=5, alias="TOP_K")
    retrieval_fetch_k: int = 10
    max_upload_bytes: int = 25 * 1024 * 1024
    database_url: str = Field(
        default=f"sqlite:///{DATA_DIR / 'rag_app.db'}",
        alias="DATABASE_URL",
    )
    max_history_messages: int = Field(default=12, alias="MAX_HISTORY_MESSAGES")
    llm_temperature: float = Field(default=0, alias="TEMPERATURE")
    max_tokens: int | None = Field(default=None, alias="MAX_TOKENS")

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


settings = Settings()

PDF_PATH = settings.pdf_path
CHROMA_PATH = settings.chroma_path
COLLECTION_NAME = settings.collection_name
EMBEDDING_MODEL = settings.embedding_model
LLM_MODEL = settings.llm_model
CHUNK_SIZE = settings.chunk_size
CHUNK_OVERLAP = settings.chunk_overlap
RETRIEVAL_K = settings.retrieval_k
RETRIEVAL_FETCH_K = settings.retrieval_fetch_k
MAX_UPLOAD_BYTES = settings.max_upload_bytes
DATABASE_URL = settings.database_url
MAX_HISTORY_MESSAGES = settings.max_history_messages
LLM_TEMPERATURE = settings.llm_temperature
MAX_TOKENS = settings.max_tokens


def ensure_runtime_directories() -> None:
    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    VECTORSTORES_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.joinpath("uploads").mkdir(parents=True, exist_ok=True)


def file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for block in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()
