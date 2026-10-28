from __future__ import annotations

import os
import warnings
from io import BytesIO
from pathlib import Path
from tempfile import NamedTemporaryFile

from PIL import Image, ImageOps, UnidentifiedImageError

MEDIA_ROOT = Path(__file__).resolve().parents[2] / "media"
PROFILE_PICTURES_DIR = MEDIA_ROOT / "pp"
DEFAULT_PROFILE_PICTURE = PROFILE_PICTURES_DIR / "default.jpg"
MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024
MAX_PROFILE_PICTURE_DIMENSION = 1024
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


class InvalidProfilePicture(ValueError):
    """Raised when an uploaded file is not a supported, decodable image."""


def ensure_profile_picture_storage() -> None:
    PROFILE_PICTURES_DIR.mkdir(parents=True, exist_ok=True)
    if not DEFAULT_PROFILE_PICTURE.is_file():
        raise FileNotFoundError(f"Default profile picture is missing: {DEFAULT_PROFILE_PICTURE}")


def profile_picture_url(user_id: int) -> str:
    ensure_profile_picture_storage()
    uploaded_picture = PROFILE_PICTURES_DIR / f"{user_id}.jpg"
    picture = uploaded_picture if uploaded_picture.is_file() else DEFAULT_PROFILE_PICTURE
    version = picture.stat().st_mtime_ns
    return f"/media/pp/{picture.name}?v={version}"


def delete_profile_picture(user_id: int) -> None:
    (PROFILE_PICTURES_DIR / f"{user_id}.jpg").unlink(missing_ok=True)


def save_profile_picture(user_id: int, content: bytes) -> None:
    if not content:
        raise InvalidProfilePicture("Choose an image to upload.")
    if len(content) > MAX_PROFILE_PICTURE_BYTES:
        raise InvalidProfilePicture("Profile pictures must be 5 MB or smaller.")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as uploaded:
                if uploaded.format not in ALLOWED_IMAGE_FORMATS:
                    raise InvalidProfilePicture("Upload a JPEG, PNG, or WebP image.")
                uploaded.verify()

            with Image.open(BytesIO(content)) as uploaded:
                image = ImageOps.exif_transpose(uploaded)
                image.thumbnail((MAX_PROFILE_PICTURE_DIMENSION, MAX_PROFILE_PICTURE_DIMENSION))
                if image.mode in ("RGBA", "LA") or "transparency" in image.info:
                    rgba = image.convert("RGBA")
                    background = Image.new("RGB", rgba.size, "white")
                    background.paste(rgba, mask=rgba.getchannel("A"))
                    image = background
                else:
                    image = image.convert("RGB")

                output = BytesIO()
                image.save(output, format="JPEG", quality=88, optimize=True)
    except InvalidProfilePicture:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning, OSError, UnidentifiedImageError, ValueError) as error:
        raise InvalidProfilePicture("The uploaded file is not a valid supported image.") from error

    PROFILE_PICTURES_DIR.mkdir(parents=True, exist_ok=True)
    destination = PROFILE_PICTURES_DIR / f"{user_id}.jpg"
    temporary_path = None
    try:
        with NamedTemporaryFile(dir=PROFILE_PICTURES_DIR, prefix=f".{user_id}-", suffix=".tmp", delete=False) as temporary:
            temporary_path = Path(temporary.name)
            temporary.write(output.getvalue())
        os.replace(temporary_path, destination)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()
