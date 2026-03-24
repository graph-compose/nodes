import re
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field, field_validator


class DownloadFormat(str, Enum):
    MP4 = "mp4"
    MP3 = "mp3"


class DownloadQuality(str, Enum):
    HIGHEST = "highest"
    LOWEST = "lowest"


# Allowlist of supported sites
SUPPORTED_SITE_PATTERNS = [
    r"(youtube\.com|youtu\.be)",
    r"soundcloud\.com",
    r"vimeo\.com",
    r"(twitter\.com|x\.com)",
    r"tiktok\.com",
    r"instagram\.com",
]

COMBINED_PATTERN = re.compile(
    r"^https?://(www\.)?(" + "|".join(SUPPORTED_SITE_PATTERNS) + r")",
    re.IGNORECASE,
)


class DownloadRequest(BaseModel):
    url: str = Field(
        ...,
        description="URL of the video/audio to download (YouTube, SoundCloud, Vimeo, Twitter/X, TikTok, Instagram)",
    )
    format: Optional[DownloadFormat] = Field(
        default=DownloadFormat.MP4,
        description="Desired output format",
    )
    quality: Optional[DownloadQuality] = Field(
        default=DownloadQuality.HIGHEST,
        description="Desired quality level",
    )

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not COMBINED_PATTERN.match(v):
            raise ValueError(
                "URL must be from a supported platform: YouTube, SoundCloud, Vimeo, Twitter/X, TikTok, or Instagram"
            )
        return v

    class Config:
        json_schema_extra = {
            "x-tags": ["ytdl"],
            "example": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "format": "mp4",
                "quality": "highest",
            },
        }
