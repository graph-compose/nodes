from fastapi import APIRouter
from fastapi.responses import JSONResponse
from typing import Dict, Any

from ..models import DownloadRequest, DownloadResponse
from ..services import DownloadService

router = APIRouter(prefix="/ytdl", tags=["ytdl"])

download_service = DownloadService()

ErrorResponseSchemaForDocs = {
    "type": "object",
    "properties": {
        "success": {"type": "boolean", "example": False},
        "message": {"type": "string", "description": "Error details"},
        "data": {"type": "null", "example": None},
    },
}


@router.post(
    "/download",
    response_model=DownloadResponse,
    operation_id="download_media_from_url",
    summary="Download video/audio from URL",
    description=(
        "Download video or audio from a supported URL (YouTube, SoundCloud, Vimeo, "
        "Twitter/X, TikTok, Instagram) and return a public download link. "
        "Supports MP4 video and MP3 audio formats with highest/lowest quality selection. "
        "Files are stored temporarily and auto-cleaned after 14 days."
    ),
    responses={
        500: {
            "description": "Download failed",
            "content": {
                "application/json": {"schema": ErrorResponseSchemaForDocs}
            },
        },
    },
)
async def download_media(request: DownloadRequest) -> Dict[str, Any]:
    """
    Download video or audio from a supported URL and return a public download link.
    """
    try:
        result = await download_service.download(request)

        if result.task_status == "succeed":
            return {
                "success": True,
                "message": None,
                "data": result.model_dump(),
            }
        else:
            return JSONResponse(
                content={
                    "success": False,
                    "message": result.task_status_msg,
                    "data": result.model_dump(),
                },
                status_code=500,
            )
    except Exception as e:
        return JSONResponse(
            content={"success": False, "message": str(e), "data": None},
            status_code=500,
        )


