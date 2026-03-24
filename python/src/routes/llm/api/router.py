from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any

from ..models import (
    LLMRequest,
    SimpleQueryRequest,
    Message,
    MessageRole,
    UserFriendlyResponse,
    ApiResponse,
)
from ..services import LLMService, ResponseFormatter
from litellm.types.utils import ModelResponse

router = APIRouter(prefix="/llm", tags=["LLM"])

# Define the schema for the default FastAPI HTTPException detail
HttpErrorDetailSchema = {"type": "object", "properties": {"detail": {"type": "string"}}}

# Define the schema for the error response manually for documentation
ErrorResponseSchemaForDocs = {
    "type": "object",
    "properties": {
        "success": {"type": "boolean", "example": False},
        "message": {"type": "string", "description": "Error details"},
        "data": {"type": "null", "example": None},
    },
}


# DO NOT EDIT. ROUTER IS PURPOSEFULLY NOT SET
# @router.post("/chat", response_model=ApiResponse[UserFriendlyResponse])
def generate_chat_completion(request: LLMRequest) -> Dict[str, Any]:
    """
    Generate a chat completion using the specified LLM provider.
    Supports full conversation history with multiple messages.

    Returns:
        A standardized API response wrapping the user-friendly LLM response in the 'data' field.
    """
    try:
        # Get the full model response
        model_response = LLMService.generate_completion(request)

        # Convert to user-friendly format (dictionary)
        user_friendly_response_dict = ResponseFormatter.create_user_friendly_response(
            model_response
        )

        # Wrap in the standard API response structure
        return {"success": True, "message": None, "data": user_friendly_response_dict}
    except Exception as e:
        # Manually create the error response in our standard format
        error_response_dict = {"success": False, "message": str(e), "data": None}
        # Return a JSONResponse with the custom structure and 500 status code
        return JSONResponse(content=error_response_dict, status_code=500)


@router.post(
    "/query",
    response_model=ApiResponse[UserFriendlyResponse],
    operation_id="ask_an_ai_agent",
    responses={
        500: {
            "description": "Internal Server Error (including LLM provider errors)",
            "content": {"application/json": {"schema": ErrorResponseSchemaForDocs}},
        }
        # FastAPI will automatically add 422 for validation errors
    },
)
def ask_an_ai_agent(request: SimpleQueryRequest) -> Dict[str, Any]:
    """
    Generate an AI completion for a simple one-shot query using the specified LLM provider.
    This is a simplified interface when only a single query is needed.

    Returns:
        A standardized API response wrapping the user-friendly LLM response in the 'data' field.
    """
    try:
        # Convert SimpleQueryRequest to LLMRequest format
        chat_request = LLMRequest(
            model=request.model,
            messages=[Message(role=MessageRole.USER, content=request.message)],
            system_prompt=request.system_prompt,
            api_key=request.api_key,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        # Get the full model response
        model_response = LLMService.generate_completion(chat_request)

        # Convert to user-friendly format (dictionary)
        user_friendly_response_dict = ResponseFormatter.create_user_friendly_response(
            model_response
        )

        # Wrap in the standard API response structure
        return {"success": True, "message": None, "data": user_friendly_response_dict}

    except Exception as e:
        # Manually create the error response in our standard format
        error_response_dict = {"success": False, "message": str(e), "data": None}
        # Return a JSONResponse with the custom structure and 500 status code
        return JSONResponse(content=error_response_dict, status_code=500)
