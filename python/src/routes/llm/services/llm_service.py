from typing import Dict, Any, List
import logging
import traceback
from litellm import completion
from litellm.types.utils import ModelResponse

from ..models.requests import LLMRequest
from .response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)


class LLMService:
    """
    Core service for interacting with LLM providers through LiteLLM
    """

    @staticmethod
    def generate_completion(request: LLMRequest) -> ModelResponse:
        """
        Generate a completion using LiteLLM

        Args:
            request: The LLMRequest containing model, messages, and other parameters

        Returns:
            A ModelResponse object containing the LLM's response

        Raises:
            Exception: If there's an error during completion generation
        """
        try:
            # Log the incoming request
            logger.info(f"Processing request for model: {request.model}")

            # Convert messages to dict format
            messages = [msg.dict() for msg in request.messages]
            logger.debug(f"Converted messages: {messages}")

            # If system prompt is provided, prepend it to messages
            if request.system_prompt:
                logger.info("Adding system prompt to messages")
                messages = [
                    {"role": "system", "content": request.system_prompt}
                ] + messages

            # Call LiteLLM with the provided parameters
            logger.info("Calling LiteLLM completion")
            response = completion(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                api_key=request.api_key,
            )

            logger.info("Successfully generated completion")
            # Convert response to our format
            return ResponseFormatter.serialize_response(response)

        except Exception as e:
            logger.error(f"Error in generate_completion: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # LiteLLM already maps provider-specific errors to OpenAI-style errors
            raise
