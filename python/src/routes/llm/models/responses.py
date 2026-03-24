from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional

# Define a generic type variable
T = TypeVar("T")


# Generic API Response Wrapper
class ApiResponse(BaseModel, Generic[T]):
    success: bool = Field(..., description="Indicates if the request was successful")
    message: Optional[str] = Field(
        None, description="Optional message, typically used for errors"
    )
    data: Optional[T] = Field(None, description="The actual data payload")

    class Config:
        json_schema_extra = {
            "x-tags": ["LLM"],
            "example": {
                "success": True,
                "message": None,
                "data": {
                    "response": "The capital of France is Paris.",
                    "model": "openai/gpt-4",
                    "id": "chatcmpl-123456789",
                },
            },
        }


class UserFriendlyResponse(BaseModel):
    """User-friendly response format for LLM completions"""

    response: str = Field(..., description="The text response from the assistant")
    model: str = Field(..., description="The model used for generation")
    id: str = Field(..., description="The unique identifier for this response")

    class Config:
        json_schema_extra = {
            "x-tags": ["LLM"],
            "example": {
                "response": "The capital of France is Paris.",
                "model": "openai/gpt-4",
                "id": "chatcmpl-123456789",
            },
        }
