from typing import Dict, Any
import logging
import time
from litellm.types.utils import ModelResponse

logger = logging.getLogger(__name__)


class ResponseFormatter:
    """
    Handles formatting and conversion of LLM responses
    """

    @staticmethod
    def serialize_response(response: Any) -> ModelResponse:
        """
        Convert LiteLLM response to our ModelResponse format

        Args:
            response: The raw response from LiteLLM

        Returns:
            A properly formatted ModelResponse object
        """
        try:
            # LiteLLM responses are already in OpenAI format
            if isinstance(response, dict):
                return ModelResponse(**response)
            elif hasattr(response, "model_dump"):
                return ModelResponse(**response.model_dump())
            elif hasattr(response, "__dict__"):
                return ModelResponse(**response.__dict__)

            # If we can't create a proper response, fall back to basic format
            logger.warning(
                "Could not create structured response, falling back to basic format"
            )
            return ModelResponse(
                id="fallback-response",
                created=0,
                model="unknown",
                object="chat.completion",
                choices=[
                    {
                        "finish_reason": "stop",
                        "index": 0,
                        "message": {"content": str(response), "role": "assistant"},
                    }
                ],
                usage={
                    "completion_tokens": 0,
                    "prompt_tokens": 0,
                    "total_tokens": 0,
                },
            )
        except Exception as e:
            logger.error(f"Error serializing response: {str(e)}")
            logger.error(f"Original response: {response}")
            raise

    @staticmethod
    def create_user_friendly_response(model_response: ModelResponse) -> Dict[str, Any]:
        """
        Create a user-friendly response format from the ModelResponse

        Args:
            model_response: The ModelResponse object from LiteLLM

        Returns:
            A dictionary compatible with UserFriendlyResponse model
        """
        try:
            # Extract the assistant's message from the first choice
            if model_response.choices and len(model_response.choices) > 0:
                first_choice = model_response.choices[0]
                if hasattr(first_choice, "message") and first_choice.message:
                    message_content = first_choice.message.content
                elif isinstance(first_choice, dict) and "message" in first_choice:
                    message_content = first_choice["message"].get("content", "")
                else:
                    logger.warning("Could not extract message content from response")
                    message_content = "No response content available"

                # Create the user-friendly response
                return {
                    "response": message_content,
                    "model": model_response.model,
                    "id": model_response.id,
                }
            else:
                logger.warning("No choices found in model response")
                return {
                    "response": "No response generated",
                    "model": getattr(model_response, "model", "unknown"),
                    "id": getattr(model_response, "id", "fallback-id"),
                }
        except Exception as e:
            logger.error(f"Error creating user-friendly response: {str(e)}")
            logger.error(f"Original response: {model_response}")
            return {
                "response": "Error processing response",
                "model": "error",
                "id": "error-" + str(int(time.time())),
            }
