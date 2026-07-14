import os
import re
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import DATA_DIR, MAX_UPLOAD_BYTES

UPLOAD_DIR = DATA_DIR / "uploads"
ALLOWED_EXTENSIONS = {".pdf"}
CHUNK_SIZE = 1024 * 1024


def _safe_stem(name: str) -> str:
    stem = Path(name).stem[:80] or "upload"
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", stem).strip(".-") or "upload"


def save_uploaded_file(file: UploadFile) -> Path:
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    original_name = Path(file.filename or "upload.pdf").name
    extension = Path(original_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Only PDF uploads are supported.")

    safe_stem = _safe_stem(original_name)
    file_name = f"{safe_stem}-{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / file_name

    total_bytes = 0
    with file_path.open("wb") as buffer:
        while True:
            chunk = file.file.read(CHUNK_SIZE)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_BYTES:
                buffer.close()
                file_path.unlink(missing_ok=True)
                raise ValueError(
                    f"Upload exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit."
                )
            buffer.write(chunk)

    return file_path
