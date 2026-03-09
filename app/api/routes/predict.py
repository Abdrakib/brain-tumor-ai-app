"""Prediction routes."""
import logging
import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response

from core.predictor import predict_with_gradcam, get_gradcam_overlay_bytes
from core.image_validation import validate_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("")
async def predict(file: UploadFile = File(...)):
    """
    Classify brain MRI image and return prediction with Grad-CAM overlay.
    Returns: ok, prediction, confidence, probs, uncertain, message, request_id, gradcam_overlay_b64.
    """
    request_id = str(uuid.uuid4())[:8]
    logger.info("POST /predict received request_id=%s", request_id)

    if not file.content_type or file.content_type.lower() not in ("image/jpeg", "image/jpg", "image/png"):
        logger.warning("Invalid file type: %s", file.content_type)
        raise HTTPException(
            status_code=400,
            detail="Only JPEG and PNG images are accepted.",
        )

    try:
        img_bytes = await file.read()
    except Exception as e:
        logger.exception("Failed to read uploaded file: %s", e)
        raise HTTPException(status_code=400, detail="Failed to read image file.") from e

    try:
        validate_image(img_bytes, file.content_type)
    except ValueError as e:
        logger.warning("Validation failed: %s", e)
        raise HTTPException(status_code=400, detail=str(e)) from e

    try:
        result = predict_with_gradcam(img_bytes)
        result["request_id"] = request_id
        logger.info("Prediction success request_id=%s prediction=%s", request_id, result.get("prediction"))
        return JSONResponse(
            content=result,
            headers={"Cache-Control": "no-store"},
        )
    except RuntimeError as e:
        if "not loaded" in str(e):
            logger.error("Model not loaded: %s", e)
            raise HTTPException(
                status_code=503,
                detail="Model not ready. Ensure model and label map are loaded at startup.",
            ) from e
        logger.exception("RuntimeError in prediction: %s", e)
        raise
    except ValueError as e:
        logger.warning("ValueError in prediction: %s", e)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("Prediction failed: %s", e)
        raise HTTPException(status_code=500, detail="Prediction failed.") from e


overlay_router = APIRouter(tags=["predict"])


@overlay_router.post("/predict_overlay")
async def predict_overlay(file: UploadFile = File(...)):
    """
    Return the Grad-CAM overlay as PNG directly (no prediction metadata).
    """
    logger.info("POST /predict_overlay received request")
    if not file.content_type or file.content_type.lower() not in ("image/jpeg", "image/jpg", "image/png"):
        logger.warning("Invalid file type: %s", file.content_type)
        raise HTTPException(
            status_code=400,
            detail="Only JPEG and PNG images are accepted.",
        )

    try:
        img_bytes = await file.read()
    except Exception as e:
        logger.exception("Failed to read uploaded file: %s", e)
        raise HTTPException(status_code=400, detail="Failed to read image file.") from e

    try:
        validate_image(img_bytes, file.content_type)
    except ValueError as e:
        logger.warning("Validation failed: %s", e)
        raise HTTPException(status_code=400, detail=str(e)) from e

    try:
        overlay_bytes = get_gradcam_overlay_bytes(img_bytes)
        logger.info("Grad-CAM overlay generated successfully")
        return Response(
            content=overlay_bytes,
            media_type="image/png",
            headers={"Cache-Control": "no-store"},
        )
    except RuntimeError as e:
        if "not loaded" in str(e):
            logger.error("Model not loaded: %s", e)
            raise HTTPException(
                status_code=503,
                detail="Model not ready. Ensure model and label map are loaded at startup.",
            ) from e
        logger.exception("RuntimeError in overlay: %s", e)
        raise
    except ValueError as e:
        logger.warning("ValueError in overlay: %s", e)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("Grad-CAM overlay failed: %s", e)
        raise HTTPException(status_code=500, detail="Overlay generation failed.") from e
