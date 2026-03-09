"""Image validation for brain MRI API."""
import io
import logging
from typing import Tuple

from PIL import Image

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
MIN_SIZE = 128


def validate_image(img_bytes: bytes, content_type: str | None) -> Tuple[int, int]:
    """
    Validate uploaded image. Raises ValueError on failure.
    Returns (width, height) on success.
    """
    if not content_type or content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Only JPEG and PNG images are accepted.")

    if len(img_bytes) == 0:
        raise ValueError("Empty image file.")

    try:
        img = Image.open(io.BytesIO(img_bytes))
        img.load()
    except Exception as e:
        logger.warning("Unreadable image: %s", e)
        raise ValueError("Image could not be read or is corrupted.") from e

    w, h = img.size

    if w < MIN_SIZE or h < MIN_SIZE:
        raise ValueError(f"Image must be at least {MIN_SIZE}x{MIN_SIZE} pixels. Got {w}x{h}.")

    mode = img.mode
    if mode not in ("RGB", "L", "RGBA"):
        raise ValueError(f"Invalid image format. Expected RGB, grayscale, or RGBA, got {mode}.")

    return w, h
