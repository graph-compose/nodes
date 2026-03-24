from pydantic import BaseModel, Field
from .enums import MessageRole


class Message(BaseModel):
    """Chat message format following OpenAI's convention"""

    role: MessageRole = Field(..., description="The role of the message sender")
    content: str = Field(..., description="The content of the message")
