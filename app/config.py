"""Configuration for the brain tumor API."""
from pathlib import Path

# Paths - relative to project root (deployment-safe, no hardcoded Windows paths)
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
MODEL_VERSION = "v1"
MODEL_PATH = MODELS_DIR / MODEL_VERSION / "adv_final_tfhub.keras"
LABEL_MAP_PATH = MODELS_DIR / MODEL_VERSION / "label_to_idx.json"

# Model params (must match notebook)
IMG_SIZE = (224, 224)
MAX_UPLOAD_SIZE_MB = 10
