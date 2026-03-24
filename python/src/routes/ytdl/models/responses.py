from typing import Optional
from pydantic import BaseModel, Field


class TaskResultData(BaseModel):
    url: str = Field(..., description="Public URL to the downloaded file")
    format: str = Field(..., description="Format of the downloaded file")
    title: str = Field(..., description="Original video/audio title")
    duration: Optional[int] = Field(None, description="Duration in seconds")
    size: int = Field(-1, description="File size in bytes")


class DownloadTaskResult(BaseModel):
    task_id: str = Field(..., description="Unique identifier for the download task")
    task_status: str = Field(
        ..., description="Current status: submitted, processing, succeed, failed"
    )
    task_status_msg: str = Field(..., description="Status message or error detail")
    task_result: Optional[TaskResultData] = Field(
        None, description="Download result, present when status is succeed"
    )
    created_at: int = Field(..., description="Unix timestamp (ms) when task was created")
    updated_at: int = Field(..., description="Unix timestamp (ms) of last update")


class DownloadResponse(BaseModel):
    success: bool = Field(..., description="Whether the operation succeeded")
    message: Optional[str] = Field(None, description="Optional message")
    data: Optional[DownloadTaskResult] = Field(None, description="The task result data")

    class Config:
        json_schema_extra = {
            "x-tags": ["ytdl"],
        }
