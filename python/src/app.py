import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from dotenv import load_dotenv

# Ensure local .env variables are loaded before importing route modules.
# This prevents startup-time failures when routes initialize services at import.
load_dotenv()

from src.routes.llm import router as llm_router  # noqa: E402
from src.routes.ytdl import router as ytdl_router  # noqa: E402

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PUBLIC_URL = os.environ.get("PUBLIC_URL", "http://localhost:8090").strip()
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "*")
CORS_ALLOW_CREDENTIALS = (
    os.environ.get("CORS_ALLOW_CREDENTIALS", "false").lower() == "true"
)

LLM_X_META = {
    "tags": ["ai", "llm", "chat", "completion"],
    "category": "AI/ML",
    "provider": "LiteLLM",
    "imageUrl": "https://storage.cloud.google.com/graph-compose-public/llm.png",
    "sourceUrl": "https://github.com/BerriAI/litellm",
}

YTDL_X_META = {
    "tags": [
        "utilities",
        "media",
        "youtube",
        "soundcloud",
        "vimeo",
        "twitter",
        "tiktok",
        "instagram",
        "downloader",
    ],
    "category": "Media",
    "provider": "yt-dlp",
    "imageUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    "sourceUrl": "https://github.com/yt-dlp/yt-dlp",
}


def parse_allowed_origins(origins_raw: str) -> list[str]:
    return [origin.strip() for origin in origins_raw.split(",") if origin.strip()]


CORS_ORIGINS = parse_allowed_origins(CORS_ALLOWED_ORIGINS)
if not CORS_ORIGINS:
    CORS_ORIGINS = ["*"]

if CORS_ORIGINS == ["*"] and CORS_ALLOW_CREDENTIALS:
    logger.warning(
        "CORS_ALLOW_CREDENTIALS cannot be true when CORS_ALLOWED_ORIGINS='*'; forcing credentials off."
    )
    CORS_ALLOW_CREDENTIALS = False

# Create FastAPI app
app = FastAPI(
    title="Python Services API",
    description="""
    API providing Python-based services for Graph Compose workflows.

    Available endpoints:
    - `/llm/query`: LLM completions via LiteLLM (multi-provider)
    - `/ytdl/download`: Media download via yt-dlp (YouTube, SoundCloud, Vimeo, Twitter/X, TikTok, Instagram)
    """,
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc UI
    openapi_url="/openapi.json",
    servers=[{"url": PUBLIC_URL}],
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        servers=app.servers,
    )

    # Modify the HTTPValidationError schema to add x-tag
    if "components" in openapi_schema and "schemas" in openapi_schema["components"]:
        if "HTTPValidationError" in openapi_schema["components"]["schemas"]:
            openapi_schema["components"]["schemas"]["HTTPValidationError"]["x-tags"] = [
                "LLM"  # Add the extension
            ]
        # Also modify the nested ValidationError schema
        if "ValidationError" in openapi_schema["components"]["schemas"]:
            openapi_schema["components"]["schemas"]["ValidationError"]["x-tags"] = [
                "LLM"  # Add the extension
            ]

    for path, path_item in openapi_schema.get("paths", {}).items():
        for method in path_item.values():
            if not isinstance(method, dict):
                continue

            if path.startswith("/llm/"):
                method["x-meta"] = LLM_X_META
            elif path.startswith("/ytdl/"):
                method["x-meta"] = YTDL_X_META

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add routes
app.include_router(llm_router)
app.include_router(ytdl_router)


def create_error_response(message: str, status: int = 500) -> None:
    """Helper function to create consistent error responses"""
    raise HTTPException(status_code=status, detail=message)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8090)
