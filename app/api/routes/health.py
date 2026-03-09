"""Health check routes."""
from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """Liveness probe."""
    return {"status": "ok"}


@router.get("/ready")
async def ready():
    """Readiness probe - model loaded."""
    try:
        from app.core.model_loader import get_model
        get_model()
        return {"status": "ready"}
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Model not loaded")
