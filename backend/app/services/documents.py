import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import uuid4

from app.services.profile_pictures import MEDIA_ROOT

DOCUMENT_STORAGE_DIR = MEDIA_ROOT / "documents"
MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".txt", ".doc", ".docx"}


class InvalidDocument(ValueError):
    """Raised when an uploaded document is empty, unsupported, or invalid."""


def _validate_document(content: bytes, extension: str) -> None:
    if not content:
        raise InvalidDocument("Choose a non-empty document to upload.")
    if len(content) > MAX_DOCUMENT_BYTES:
        raise InvalidDocument("Documents must be 25 MB or smaller.")
    if extension == ".pdf" and not content.startswith(b"%PDF-"):
        raise InvalidDocument("The selected file is not a valid PDF.")
    if extension == ".docx" and not content.startswith(b"PK"):
        raise InvalidDocument("The selected file is not a valid DOCX document.")
    if extension == ".doc" and not content.startswith(bytes.fromhex("D0CF11E0A1B11AE1")):
        raise InvalidDocument("The selected file is not a valid DOC document.")
    if extension == ".txt":
        if b"\x00" in content:
            raise InvalidDocument("The selected file is not a valid text document.")
        try:
            content.decode("utf-8-sig")
        except UnicodeDecodeError as error:
            raise InvalidDocument("Text documents must use UTF-8 encoding.") from error


def save_document(content: bytes, original_filename: str) -> str:
    extension = Path(original_filename).suffix.lower()
    if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise InvalidDocument("Upload a PDF, TXT, DOC, or DOCX file.")
    _validate_document(content, extension)

    DOCUMENT_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    storage_name = f"{uuid4().hex}{extension}"
    destination = DOCUMENT_STORAGE_DIR / storage_name
    temporary_path = None
    try:
        with NamedTemporaryFile(dir=DOCUMENT_STORAGE_DIR, prefix=".upload-", suffix=".tmp", delete=False) as temporary:
            temporary_path = Path(temporary.name)
            temporary.write(content)
        os.replace(temporary_path, destination)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()
    return storage_name


def delete_document_file(storage_name: str | None) -> None:
    if storage_name:
        (DOCUMENT_STORAGE_DIR / Path(storage_name).name).unlink(missing_ok=True)
