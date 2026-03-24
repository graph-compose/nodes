# Contributing to Graph Compose Nodes Python

Thank you for your interest in contributing. This document explains how to add new capabilities and fix issues in the Python services layer.

## How This Service Fits In

This FastAPI service handles Python-ecosystem integrations for Graph Compose workflows. The Graph Compose UI discovers this service directly via `/openapi.json` as part of multi-service discovery.

If you want to add a new third-party integration or recipe:
- TypeScript integrations live in `../nodes`
- Python integrations live here
- Recipes live in `../recipes`

## Adding a New Route Module

Each capability lives in its own directory under `src/routes/<module>/`:

```
src/routes/example/
  api/
    router.py         # FastAPI router with endpoints
  models/
    __init__.py       # Exports all models
    requests.py       # Pydantic request models
    responses.py      # Pydantic response models
  services/
    __init__.py       # Exports services
    example_service.py
  __init__.py         # Exports router and models
```

### 1. Define models (`models/requests.py`, `models/responses.py`)

Use Pydantic with Field descriptions for auto-generated OpenAPI docs:

```python
from pydantic import BaseModel, Field

class ExampleRequest(BaseModel):
    query: str = Field(..., description="The search query")
    max_results: int = Field(default=10, description="Maximum results to return")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "graph compose workflows",
                "max_results": 10,
            },
            "x-tags": ["example"],
        }

class ExampleData(BaseModel):
    results: list[dict] = Field(..., description="Search results")

class ExampleResponse(BaseModel):
    success: bool
    message: str | None = None
    data: ExampleData | None = None
```

### 2. Write the service (`services/example_service.py`)

Isolate all external API calls and business logic:

```python
import logging
import httpx

logger = logging.getLogger(__name__)

class ExampleService:
    @staticmethod
    async def search(query: str, max_results: int) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.example.com/search",
                params={"q": query, "limit": max_results},
            )
            response.raise_for_status()
            return response.json()
```

### 3. Create the router (`api/router.py`)

```python
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..models.requests import ExampleRequest
from ..models.responses import ExampleResponse
from ..services.example_service import ExampleService

router = APIRouter(prefix="/example", tags=["Example"])

@router.post("/search", response_model=ExampleResponse, operation_id="example_search")
async def search(request: ExampleRequest):
    try:
        result = await ExampleService.search(request.query, request.max_results)
        return {"success": True, "message": None, "data": {"results": result}}
    except Exception as e:
        return JSONResponse(
            content={"success": False, "message": str(e), "data": None},
            status_code=500,
        )
```

### 4. Register in the app

Add your router to `src/app.py`:

```python
from src.routes.example import router as example_router
app.include_router(example_router)
```

FastAPI automatically generates OpenAPI docs from your Pydantic models and route definitions. Check `/docs` (Swagger UI) or `/openapi.json` after starting the service.

### 5. OpenAPI compatibility contract (required)

This service must satisfy the same OpenAPI contract as `../nodes`:

- `servers[0].url` is present and absolute.
- every operation has a stable `operationId`.
- every operation has `x-meta` with required keys:
  - `tags`
  - `category`
  - `provider`
- optional `x-meta` keys:
  - `imageUrl`
  - `sourceUrl`

Python endpoints are discovered directly from this service's OpenAPI document (`/openapi.json`).

Before submitting, run:

```bash
python src/tests/openapi_contract_live_test.py
```

## Reporting Issues

Use the provided issue templates:
- **Bug Report** -- for broken behavior, unexpected errors, or regressions
- **Feature Request** -- for new endpoints or enhancements

Include as much detail as possible: steps to reproduce, expected vs actual behavior, environment information, and relevant logs.

## Submitting Pull Requests

1. Fork the repository and clone your fork locally
2. Create a new branch from `main` (e.g., `add-embeddings-endpoint` or `fix-response-schema`)
3. Make your changes, following the code style guidelines below
4. Test locally
5. Commit with a DCO sign-off (see below)
6. Push to your fork and open a pull request against `main`

Keep pull requests focused on a single change. If you have multiple unrelated fixes, submit them as separate PRs.

## Code Style

- **Language**: Python 3.11 or later
- **Framework**: FastAPI with Pydantic for validation
- **New Endpoints**: FastAPI generates OpenAPI specs automatically from your route definitions and Pydantic models, so ensure your type annotations and Field descriptions are complete
- **Formatting**: Follow the existing code conventions in the repository. Consistency with the surrounding code takes priority over personal preference

## Testing

Before submitting a pull request:
- The service starts without errors: `uvicorn src.app:app --reload --port 8090`
- All new and existing endpoints respond with the expected status codes and payloads
- The OpenAPI spec at `/docs` or `/openapi.json` is valid and reflects your endpoints
- The live OpenAPI contract test passes: `python src/tests/openapi_contract_live_test.py`

## DCO Sign-Off

All commits must include a `Signed-off-by` line, certifying that you have the right to submit the code under the project's license ([Developer Certificate of Origin](https://developercertificate.org/)).

```bash
git commit -s -m "Add embeddings endpoint"
```

This produces: `Signed-off-by: Your Name <your.email@example.com>`

## Code of Conduct

All participants are expected to follow the project's [Code of Conduct](./CODE_OF_CONDUCT.md). Be welcoming, respectful, and professional in all interactions.
