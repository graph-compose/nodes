import os
import uuid
import logging
from google.cloud import storage

logger = logging.getLogger(__name__)

BUCKET_NAME = os.environ.get("STORAGE_BUCKET", "").strip()
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "").strip()


class GCSStorageService:
    def __init__(
        self,
        bucket_name: str = BUCKET_NAME,
        project_id: str = PROJECT_ID,
    ):
        bucket_name = (bucket_name or "").strip()
        project_id = (project_id or "").strip()
        if not bucket_name:
            raise ValueError(
                "STORAGE_BUCKET is required for ytdl uploads. "
                "Set STORAGE_BUCKET in environment (or python/.env)."
            )

        self.client = storage.Client(project=project_id)
        self.bucket = self.client.bucket(bucket_name)
        self.bucket_name = bucket_name

    def upload_file(
        self,
        file_path: str,
        mime_type: str,
        folder: str = "ytdl",
        extension: str = ".mp4",
    ) -> str:
        """Upload a local file to GCS and return its public URL."""
        blob_name = f"{folder}/{uuid.uuid4().hex}{extension}"
        blob = self.bucket.blob(blob_name)
        logger.info(f"Uploading {file_path} to gs://{self.bucket_name}/{blob_name}")
        blob.upload_from_filename(file_path, content_type=mime_type, timeout=600)
        # Bucket uses uniform bucket-level access (public), so no per-object ACL needed
        public_url = (
            f"https://storage.googleapis.com/{self.bucket_name}/{blob_name}"
        )
        logger.info(f"Upload complete: {public_url}")
        return public_url
