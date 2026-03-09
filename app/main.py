"""FastAPI application for brain tumor classification."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import MODEL_PATH, LABEL_MAP_PATH
from core.model_loader import init_model
from api.routes import predict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model once at startup (singleton)."""
    try:
        init_model(MODEL_PATH, LABEL_MAP_PATH)
        logger.info("Model and label map loaded successfully")
    except FileNotFoundError as e:
        logger.warning("Could not load model at startup: %s", e)
        logger.warning("Place model at %s and label map at %s", MODEL_PATH, LABEL_MAP_PATH)
    yield


app = FastAPI(
    title="Brain MRI AI",
    description="Brain tumor classification API with Grad-CAM explainability.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
def root():
    return {"status": "ok", "service": "Brain MRI AI"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "Brain MRI AI"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(predict.overlay_router)
