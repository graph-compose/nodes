from enum import Enum


class Provider(str, Enum):
    """Major LLM providers supported by the API"""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MISTRAL = "mistral"
    AZURE_OPENAI = "azure"


class OpenAIModels(str, Enum):
    """Available OpenAI models"""

    GPT4_TURBO = "openai/gpt-4-0125-preview"  # Latest GPT-4 Turbo
    GPT4 = "openai/gpt-4"
    GPT35_TURBO = "openai/gpt-3.5-turbo"
    GPT35_TURBO_16K = "openai/gpt-3.5-turbo-16k"


class AnthropicModels(str, Enum):
    """Available Anthropic models"""

    CLAUDE_3_OPUS = "anthropic/claude-3-opus-20240229"
    CLAUDE_3_SONNET = "anthropic/claude-3-sonnet-20240229"
    CLAUDE_2 = "anthropic/claude-2"


class GoogleModels(str, Enum):
    """Available Google models"""

    GEMINI_PRO = "google/gemini-pro"
    GEMINI_PRO_VISION = "google/gemini-pro-vision"


class MistralModels(str, Enum):
    """Available Mistral models"""

    MISTRAL_LARGE = "mistral/mistral-large-latest"
    MISTRAL_MEDIUM = "mistral/mistral-medium"
    MISTRAL_SMALL = "mistral/mistral-small"


class MessageRole(str, Enum):
    """Valid message roles"""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
