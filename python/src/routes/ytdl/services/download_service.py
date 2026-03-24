import os
import shutil
import uuid
import time
import json
import hashlib
import logging
import tempfile
import subprocess
from typing import Optional

from ..models.requests import DownloadRequest, DownloadFormat, DownloadQuality
from ..models.responses import DownloadTaskResult, TaskResultData
from .storage_service import GCSStorageService

logger = logging.getLogger(__name__)

# Local dev cache — persists across service restarts so the same video isn't
# re-downloaded every run. Set USE_LOCAL_CACHE=false to disable.
_CACHE_ENABLED = os.environ.get("USE_LOCAL_CACHE", "true").lower() == "true"
_CACHE_PATH = os.path.expanduser("~/.ytdl-dev-cache.json")
_DOWNLOADS_DIR = os.path.expanduser("~/.ytdl-downloads")


class _LocalCache:
    """
    File-backed cache for downloaded videos.

    Stores two things per entry:
      - local_path: permanent copy of the file on disk (~/.ytdl-downloads/)
      - task_result: TaskResultData dict (includes GCS url, title, duration, size)

    Resolution order on a cache hit:
      1. local_path exists + task_result present → return task_result immediately
      2. local_path exists but no task_result (or GCS URL may be expired) →
         re-upload from local file, update cache
      3. Neither → fall through to full yt-dlp download
    """

    def __init__(self, path: str, downloads_dir: str):
        self._path = path
        self._downloads_dir = downloads_dir
        os.makedirs(downloads_dir, exist_ok=True)
        self._data: dict = self._load()

    def _load(self) -> dict:
        try:
            with open(self._path, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _save(self):
        try:
            with open(self._path, "w") as f:
                json.dump(self._data, f, indent=2)
        except Exception as e:
            logger.warning(f"[LocalCache] Failed to save cache: {e}")

    @staticmethod
    def _key(url: str, fmt: str, quality: str) -> str:
        raw = f"{url}:{fmt}:{quality}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def local_path(self, url: str, fmt: str, quality: str, ext: str) -> str:
        """Deterministic permanent path for this url+format+quality."""
        key = self._key(url, fmt, quality)
        return os.path.join(self._downloads_dir, f"{key}.{ext}")

    def get(self, url: str, fmt: str, quality: str) -> Optional[dict]:
        return self._data.get(self._key(url, fmt, quality))

    def set(self, url: str, fmt: str, quality: str, task_result: dict, local_path: str):
        self._data[self._key(url, fmt, quality)] = {
            "task_result": task_result,
            "local_path": local_path,
        }
        self._save()


_cache = _LocalCache(_CACHE_PATH, _DOWNLOADS_DIR) if _CACHE_ENABLED else None


class DownloadService:
    def __init__(self, storage_service: Optional[GCSStorageService] = None):
        self.storage = storage_service or GCSStorageService()

    def _get_video_info(self, url: str) -> dict:
        """Extract video metadata using yt-dlp --dump-json (no download)."""
        result = subprocess.run(
            ["yt-dlp", "--dump-json", "--no-download", url],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            stderr = result.stderr.strip().lower()
            if "private" in stderr or "not found" in stderr:
                raise ValueError("Video not found or is private")
            if "copyright" in stderr or "removed" in stderr:
                raise ValueError(
                    "Video has been removed due to copyright or other restrictions"
                )
            raise ValueError(f"Failed to get video info: {result.stderr.strip()}")

        return json.loads(result.stdout)

    def _build_yt_dlp_command(
        self,
        url: str,
        output_path: str,
        fmt: DownloadFormat,
        quality: DownloadQuality,
    ) -> list[str]:
        """Build the yt-dlp command arguments."""
        if fmt == DownloadFormat.MP3:
            format_str = "bestaudio/best"
        elif quality == DownloadQuality.HIGHEST:
            format_str = "bestvideo+bestaudio/best"
        else:
            format_str = "worstvideo+worstaudio/worst"

        cmd = [
            "yt-dlp",
            "-f",
            format_str,
            "-o",
            output_path,
            "--no-playlist",
            "--max-filesize",
            "2g",
        ]

        if fmt == DownloadFormat.MP3:
            cmd.extend(["--extract-audio", "--audio-format", "mp3"])
        else:
            cmd.extend(["--merge-output-format", "mp4"])

        cmd.append(url)
        return cmd

    async def download(self, request: DownloadRequest) -> DownloadTaskResult:
        task_id = uuid.uuid4().hex
        now = int(time.time() * 1000)

        extension = ".mp3" if request.format == DownloadFormat.MP3 else ".mp4"
        mime_type = "audio/mpeg" if request.format == DownloadFormat.MP3 else "video/mp4"

        # Check local dev cache first
        if _cache is not None:
            cached = _cache.get(request.url, request.format.value, request.quality.value)
            local_path = _cache.local_path(
                request.url, request.format.value, request.quality.value, extension.lstrip(".")
            )

            if cached and os.path.exists(local_path):
                # Best case: local file + cached GCS URL — nothing to do
                logger.info(
                    f"[{task_id}] Cache hit for {request.url} "
                    f"(local: {local_path}) — skipping download"
                )
                return DownloadTaskResult(
                    task_id=task_id,
                    task_status="succeed",
                    task_status_msg="Returned from local dev cache",
                    task_result=TaskResultData(**cached["task_result"]),
                    created_at=now,
                    updated_at=now,
                )

            if os.path.exists(local_path):
                # Local file exists but no cache entry (e.g. cache was cleared).
                # Re-upload to GCS and rebuild the cache entry.
                logger.info(
                    f"[{task_id}] Local file found at {local_path}, no cache entry — re-uploading to GCS"
                )
                file_size = os.path.getsize(local_path)
                public_url = self.storage.upload_file(
                    file_path=local_path,
                    mime_type=mime_type,
                    folder="ytdl",
                    extension=extension,
                )
                task_result_data = TaskResultData(
                    url=public_url,
                    format=request.format.value,
                    title="Unknown (re-uploaded from local cache)",
                    duration=None,
                    size=file_size,
                )
                _cache.set(
                    request.url,
                    request.format.value,
                    request.quality.value,
                    task_result_data.model_dump(),
                    local_path,
                )
                return DownloadTaskResult(
                    task_id=task_id,
                    task_status="succeed",
                    task_status_msg="Re-uploaded from local file",
                    task_result=task_result_data,
                    created_at=now,
                    updated_at=now,
                )

        try:
            # 1. Get video info
            logger.info(f"[{task_id}] Fetching video info for {request.url}")
            info = self._get_video_info(request.url)
            title = info.get("title", "Unknown")
            duration = info.get("duration")
            logger.info(f"[{task_id}] Video info: title={title}, duration={duration}s")

            # 2. Download to temp dir, then move to permanent local copy
            with tempfile.TemporaryDirectory() as tmpdir:
                output_template = os.path.join(tmpdir, f"download{extension}")
                cmd = self._build_yt_dlp_command(
                    request.url, output_template, request.format, request.quality
                )

                logger.info(f"[{task_id}] Starting download: {' '.join(cmd)}")
                proc = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=600,  # 10 minute timeout
                )

                if proc.returncode != 0:
                    logger.error(f"[{task_id}] yt-dlp stderr: {proc.stderr.strip()}")
                    raise RuntimeError(f"Download failed: {proc.stderr.strip()}")

                # Find the output file (yt-dlp may change extension)
                files = os.listdir(tmpdir)
                if not files:
                    raise RuntimeError("Download produced no output file")
                tmp_output = os.path.join(tmpdir, files[0])
                file_size = os.path.getsize(tmp_output)
                logger.info(f"[{task_id}] Download complete: {files[0]} ({file_size} bytes)")

                # Save permanent local copy before uploading
                saved_local_path: Optional[str] = None
                if _cache is not None:
                    saved_local_path = _cache.local_path(
                        request.url, request.format.value, request.quality.value, extension.lstrip(".")
                    )
                    shutil.copy2(tmp_output, saved_local_path)
                    logger.info(f"[{task_id}] Saved local copy: {saved_local_path}")

                # 3. Upload to GCS
                logger.info(f"[{task_id}] Uploading to GCS...")
                public_url = self.storage.upload_file(
                    file_path=tmp_output,
                    mime_type=mime_type,
                    folder="ytdl",
                    extension=extension,
                )
                logger.info(f"[{task_id}] Upload complete: {public_url}")

            task_result_data = TaskResultData(
                url=public_url,
                format=request.format.value,
                title=title,
                duration=int(duration) if duration else None,
                size=file_size,
            )

            if _cache is not None and saved_local_path:
                _cache.set(
                    request.url,
                    request.format.value,
                    request.quality.value,
                    task_result_data.model_dump(),
                    saved_local_path,
                )
                logger.info(f"[{task_id}] Cached result for {request.url}")

            return DownloadTaskResult(
                task_id=task_id,
                task_status="succeed",
                task_status_msg="Download completed successfully",
                task_result=task_result_data,
                created_at=now,
                updated_at=int(time.time() * 1000),
            )

        except Exception as e:
            logger.error(f"Download failed for {request.url}: {e}")
            return DownloadTaskResult(
                task_id=task_id,
                task_status="failed",
                task_status_msg=str(e),
                task_result=None,
                created_at=now,
                updated_at=int(time.time() * 1000),
            )
