# LLM Service

This module provides a service for interacting with various LLM providers through LiteLLM.

## Directory Structure

```
/python/routes/llm/
├── __init__.py                # Package initialization
├── api/                       # API layer
│   ├── __init__.py
│   └── router.py              # FastAPI router definitions
├── models/                    # Data models
│   ├── __init__.py
│   ├── base_models.py         # Base model definitions
│   ├── enums.py               # Enum definitions
│   ├── requests.py            # Request models
│   └── responses.py           # Response models
├── services/                  # Business logic
│   ├── __init__.py
│   ├── llm_service.py         # Core LLM service
│   └── response_formatter.py  # Response formatting logic
└── utils/                     # Utilities
    └── __init__.py
```

## Components

### API Layer

- `router.py`: Defines the FastAPI endpoints for chat completion and simple queries

### Models

- `enums.py`: Contains enum definitions for providers, models, and message roles
- `base_models.py`: Contains base model definitions like Message
- `requests.py`: Contains request models like LLMRequest and SimpleQueryRequest
- `responses.py`: Contains response models like UserFriendlyResponse

### Services

- `llm_service.py`: Core service for interacting with LLM providers
- `response_formatter.py`: Handles formatting and conversion of LLM responses

## Usage

```python
from routes.llm import router, generate_chat_completion
from routes.llm.models import LLMRequest, UserFriendlyResponse

# Add the router to your FastAPI app
app.include_router(router)

# Or use the functions directly
request = LLMRequest(...)
response = generate_chat_completion(request)
``` 