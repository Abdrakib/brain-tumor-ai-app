"""
Re-exports Grad-CAM from the standalone gradcam module.
Ensures app uses the same implementation as the reusable gradcam.py at project root.
"""
import sys
from pathlib import Path

# Ensure project root is in path for gradcam import
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from gradcam import (
    find_last_conv_layer,
    make_gradcam_heatmap,
    get_gradcam_overlay,
    get_gradcam_overlay_from_path,
    get_gradcam_overlay_from_bytes,
)

__all__ = [
    "find_last_conv_layer",
    "make_gradcam_heatmap",
    "get_gradcam_overlay",
    "get_gradcam_overlay_from_path",
    "get_gradcam_overlay_from_bytes",
]
