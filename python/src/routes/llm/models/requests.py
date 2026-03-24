from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

from .enums import Provider
from .base_models import Message


class LLMRequest(BaseModel):
    """Request format for LLM completion"""

    model: str = Field(
        ...,
        description=(
            "The identifier for the desired AI model, including the provider prefix.\n\n"
            "LiteLLM supports over 100+ LLMs. See the full list at [https://www.litellm.ai/](https://www.litellm.ai/).\n\n"
            "**Examples:**\n"
            "- OpenAI: \`openai/gpt-4o\`, \`openai/gpt-4-turbo\`\n"
            "- Anthropic: \`anthropic/claude-3-opus-20240229\`, \`anthropic/claude-3-sonnet-20240229\`\n"
            "- Google: \`google/gemini-pro\`\n"
            "- Mistral: \`mistral/mistral-large-latest\`"
        ),
    )
    messages: List[Message] = Field(
        ...,
        description=(
            "A list representing the conversation history. Each item in the list is an object \n"
            "with a \`role\` (either 'user' or 'assistant') and \`content\` (the message text).\n\n"
            "The conversation should alternate between user and assistant messages, starting with a user message.\n\n"
            "**Example:**\n"
            "```json\n"
            "[\n"
            '  { "role": "user", "content": "What is the capital of France?" },\n'
            '  { "role": "assistant", "content": "The capital of France is Paris." },\n'
            '  { "role": "user", "content": "What is its population?" }\n'
            "]\n"
            "```"
        ),
    )
    system_prompt: Optional[str] = Field(
        None,
        description=(
            "An optional instruction or context provided to the AI model before the main conversation starts. \n"
            "This helps guide the AI's persona, tone, or task.\n\n"
            '**Example:** \`"You are a helpful AI assistant that speaks like a pirate."\`'
        ),
    )
    api_key: str = Field(
        ...,
        description="API key for the selected model's provider. Must match the provider prefix in the model field.",
    )
    temperature: Optional[float] = Field(
        0.7,
        description="Temperature for response generation. Higher values make output more random, lower values more deterministic.",
        ge=0.0,
        le=2.0,
    )
    max_tokens: Optional[int] = Field(
        None,
        description="Maximum tokens in the response. If not specified, model's default is used.",
    )

    @field_validator("model")
    def validate_model(cls, v):
        """Validate that the model string includes a provider prefix"""
        if "/" not in v:
            raise ValueError(
                "Model must include provider prefix (e.g., 'openai/gpt-4' or 'anthropic/claude-3-opus-20240229')"
            )
        provider, model = v.split("/", 1)
        if provider not in [p.value for p in Provider]:
            raise ValueError(
                f"Unknown provider '{provider}'. Must be one of: {', '.join([p.value for p in Provider])}"
            )
        return v

    class Config:
        json_schema_extra = {
            "x-tags": ["LLM"],
            "example": {
                "model": "openai/gpt-4",
                "messages": [
                    {"role": "user", "content": "What is the capital of France?"}
                ],
                "system_prompt": "You are a helpful AI assistant that specializes in geography.",
                "api_key": "your-api-key",
                "temperature": 0.7,
            },
        }


class SimpleQueryRequest(BaseModel):
    """Request format for simple one-shot LLM queries"""

    model: str = Field(
        ...,
        description=(
            "The identifier for the desired AI model, including the provider prefix.\n\n"
            "LiteLLM supports over 100+ LLMs. See the full list at [https://www.litellm.ai/](https://www.litellm.ai/).\n\n"
            "**Examples:**\n"
            "- OpenAI: \`openai/gpt-4o\`, \`openai/gpt-4-turbo\`\n"
            "- Anthropic: \`anthropic/claude-3-opus-20240229\`, \`anthropic/claude-3-sonnet-20240229\`\n"
            "- Google: \`google/gemini-pro\`\n"
            "- Mistral: \`mistral/mistral-large-latest\`"
        ),
    )
    message: str = Field(
        ...,
        description=(
            "The single query or instruction you want to send to the AI model.\n\n"
            "**Example:** \`\"Translate 'hello world' to French.\"\`"
        ),
    )
    system_prompt: Optional[str] = Field(
        None,
        description=(
            "An optional instruction or context provided to the AI model before your message. \n"
            "This helps guide the AI's persona, tone, or task.\n\n"
            '**Example:** \`"You are a helpful AI assistant that specializes in language translation."\`'
        ),
    )
    api_key: str = Field(
        ...,
        description="API key for the selected model's provider. Must match the provider prefix in the model field.",
    )
    temperature: Optional[float] = Field(
        0.7,
        description="Temperature for response generation. Higher values make output more random, lower values more deterministic.",
        ge=0.0,
        le=1.0,
    )
    max_tokens: Optional[int] = Field(
        None,
        description="Maximum tokens in the response. If not specified, model's default is used.",
    )

    @field_validator("model")
    def validate_model(cls, v):
        """Validate that the model string includes a provider prefix"""
        if "/" not in v:
            raise ValueError(
                "Model must include provider prefix (e.g., 'openai/gpt-4' or 'anthropic/claude-3-opus-20240229')"
            )
        provider, model = v.split("/", 1)
        if provider not in [p.value for p in Provider]:
            raise ValueError(
                f"Unknown provider '{provider}'. Must be one of: {', '.join([p.value for p in Provider])}"
            )
        return v

    class Config:
        json_schema_extra = {
            "x-tags": ["LLM"],
            "meta": {
                "imageUrl": "https://storage.cloud.google.com/graph-compose-public/llm.png",
            },
            "example": {
                "model": "openai/gpt-4",
                "message": "What is the capital of France?",
                "system_prompt": "You are a helpful AI assistant that specializes in geography.",
                "api_key": "your-api-key",
                "temperature": 0.7,
            },
        }
