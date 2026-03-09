"""Model loading for brain tumor classification."""
import json
import logging
from pathlib import Path
from typing import Any

from tensorflow import keras

logger = logging.getLogger(__name__)

_model: keras.Model | None = None
_label_map: dict[str, int] | None = None
_idx_to_label: dict[int, str] | None = None


def load_model(model_path: Path) -> keras.Model:
    """Load the trained Keras model."""
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    model = keras.models.load_model(model_path)
    logger.info("Model loaded from %s", model_path)
    return model


def load_label_map(label_map_path: Path) -> tuple[dict[str, int], dict[int, str]]:
    """Load label mapping and build reverse index."""
    if not label_map_path.exists():
        raise FileNotFoundError(f"Label map not found: {label_map_path}")

    with open(label_map_path, encoding="utf-8") as f:
        label_to_idx = json.load(f)

    idx_to_label = {v: k for k, v in label_to_idx.items()}
    logger.info("Label map loaded: %s", label_to_idx)
    return label_to_idx, idx_to_label


def init_model(model_path: Path, label_map_path: Path) -> None:
    """Initialize model and label map (call at startup)."""
    global _model, _label_map, _idx_to_label

    _model = load_model(model_path)
    _label_map, _idx_to_label = load_label_map(label_map_path)


def get_model() -> keras.Model:
    """Get the loaded model. Raises if not initialized."""
    if _model is None:
        raise RuntimeError("Model not loaded. Call init_model first.")
    return _model


def get_label_maps() -> tuple[dict[str, int], dict[int, str]]:
    """Get label mappings. Raises if not initialized."""
    if _label_map is None or _idx_to_label is None:
        raise RuntimeError("Label map not loaded. Call init_model first.")
    return _label_map, _idx_to_label
