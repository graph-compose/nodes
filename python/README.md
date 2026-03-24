# Graph Compose Nodes Python

A FastAPI microservice providing LLM completions and media downloads for the [Graph Compose](https://graphcompose.io) workflow orchestration platform.

Graph Compose workflows are directed graphs where each node calls an external API. This service handles the Python-ecosystem integrations -- multi-provider LLM completions via LiteLLM and media downloads via yt-dlp. The Graph Compose UI fetches this service's OpenAPI document directly as part of multi-service discovery.

See these capabilities in action through the [Graph Compose Recipes](https://graphcompose.io/recipes), pre-built workflow templates that chain nodes together for tasks like trend analysis, content generation, and media processing.

## Architecture

The service is a FastAPI app with Pydantic models for request/response validation. Routes are organized into two modules:

```
src/routes/
  llm/
    models/       # Pydantic request/response models
    services/     # LiteLLM integration logic
    api/          # Route handlers
  ytdl/
    models/       # Pydantic request/response models
    services/     # yt-dlp download and GCS upload logic
    api/          # Route handlers
```

### Route Modules

| Route | Description |
|---|---|
| `POST /llm/query` | Single-turn LLM completion across multiple providers via LiteLLM |
| `POST /llm/chat` | Multi-turn LLM chat completion via LiteLLM |
| `POST /ytdl/download` | Download media from supported platforms, upload to GCS, return public URL |

**LLM** -- Supports OpenAI, Anthropic, Cohere, and any other provider available through [LiteLLM](https://github.com/BerriAI/litellm). API keys are passed in the request body by the calling workflow node, not stored as environment variables.

**YTDL** -- Supports YouTube, TikTok, Instagram, Twitter/X, SoundCloud, Vimeo, and other platforms available through [yt-dlp](https://github.com/yt-dlp/yt-dlp). Downloaded media is uploaded to Google Cloud Storage and a public URL is returned.

## Prerequisites

- Python 3.11+
- ffmpeg (required for media processing)

## Getting Started

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env with your values

# Start in development mode
uvicorn src.app:app --reload --port 8090
```

The service starts on `http://localhost:8090` by default.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | For YTDL | GCP project ID for Cloud Storage uploads |
| `STORAGE_BUCKET` | For YTDL | GCS bucket name for media uploads |
| `PUBLIC_URL` | Recommended | Public base URL advertised in `servers[0].url` in `/openapi.json` |
| `CORS_ALLOWED_ORIGINS` | Recommended | Comma-separated allowed browser origins (for example `https://graphcompose.io,http://localhost:3000`) |
| `CORS_ALLOW_CREDENTIALS` | No | Whether to allow credentials in CORS responses (`true`/`false`, default `false`) |
| `ENVIRONMENT` | No | Runtime environment (default: `development`) |
| `LOG_LEVEL` | No | Logging verbosity (default: `INFO`) |

The LLM routes do not require API keys as environment variables. Keys are passed in each request body by the nodes service and forwarded to the appropriate provider via LiteLLM.

## API Documentation

Built-in interactive docs are available when the service is running:

| Path | Format |
|---|---|
| `/docs` | Swagger UI |
| `/redoc` | ReDoc |
| `/openapi.json` | OpenAPI spec (JSON) |

### OpenAPI Contract Requirements

This service must satisfy the same compatibility contract as the TypeScript nodes service:

- `servers[0].url` must be set and absolute.
- Every operation must define a stable `operationId`.
- Operation metadata must include `x-meta` with required keys:
  - `tags`
  - `category`
  - `provider`
- Optional `x-meta` keys:
  - `imageUrl`
  - `sourceUrl`

### Contract Test (Live)

Run the service, then execute:

```bash
python src/tests/openapi_contract_live_test.py
```

This runs in strict mode by default. For local diagnostics only, you can disable strict enforcement:

```bash
STRICT_OPENAPI_CONTRACT=0 python src/tests/openapi_contract_live_test.py
```

## Deployment

A Dockerfile is included. The image uses gunicorn with uvicorn workers and installs ffmpeg during the build.

```bash
docker build -t nodes-python .
docker run -p 8090:8090 --env-file .env nodes-python
```

For GCP Cloud Run deployments, see `deploy.example.sh` and `cloudbuild.example.yaml` as starting templates.

## Recipes

The [`../recipes/`](../recipes/) directory contains reusable workflow templates that combine `nodes/` and `python/` capabilities into end-to-end workflows. Each recipe includes:

- `recipe.json` - full workflow definition and metadata
- `content.md` - walkthrough and implementation notes

Browse and import recipes from the [Graph Compose Recipes page](https://graphcompose.io/recipes), and see [`../recipes/README.md`](../recipes/README.md) for contribution requirements and validation steps.

## Contributing

This service handles LLM and media download capabilities for Graph Compose workflows. If you want to:

- **Add a new integration that only needs TypeScript/Node.js** -- contribute to the `nodes/` service in this same repository root
- **Add a new integration that requires Python** (ML libraries, yt-dlp, scientific packages, etc.) -- add the FastAPI route module here and ensure its OpenAPI output meets the shared contract
- **Add a recipe** -- recipes live at the repository root in `../recipes`
- **Improve LLM or media download support** -- you're in the right place. See [CONTRIBUTING.md](CONTRIBUTING.md)

## Related Services In This Repo

- `../nodes` -- Express.js managed integration service
- `../recipes` -- reusable workflow templates

## License

Apache 2.0
