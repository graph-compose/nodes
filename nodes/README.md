# Graph Compose Nodes

An Express.js/TypeScript microservice that provides 25+ third-party API integrations as standardized REST endpoints. Each integration uses Zod validation for request/response schemas, with OpenAPI specs auto-generated from those schemas.

This service powers the integration layer of [Graph Compose](https://graphcompose.io), a workflow orchestration platform built on Temporal. When a workflow executes, each node in the graph calls this service to interact with external APIs -- sending emails via SendGrid, generating video with Runway, transcribing audio with Deepgram, and more.

You can see these integrations in action through the [Graph Compose Recipes](https://graphcompose.io/recipes), which are pre-built workflow templates that chain multiple nodes together to solve real tasks like trend monitoring, content generation, and media processing pipelines. Recipes are included in this repository under [`../recipes/`](../recipes/).

## Architecture

This is one of two services in the repository. Both auto-generate OpenAPI specs and both are discovered by the Graph Compose platform through the same mechanism:

| Service | Stack | Location | OpenAPI |
|---|---|---|---|
| **Nodes** (this directory) | Express.js / TypeScript / Zod | `nodes/` | `/openapi.json` |
| **Python** | FastAPI / Pydantic / LiteLLM | [`../python/`](../python/) | `/openapi.json` |

The platform performs **multi-service discovery** — it fetches `/openapi.json` from both services and merges the results into a unified node catalog. Contributors can add integrations in whichever stack makes sense for the provider.

### Nodes service structure

Each route module follows a standard structure:

```
src/nodes/routes/<provider>/
  router.ts          # Route definitions
  controllers/       # Request handlers
  services/          # Business logic and API calls
  schemas/           # Zod schemas with zod-openapi extensions
```

OpenAPI specs are auto-generated per route module and merged into a single spec served at `/openapi.json`.

### Python service structure

The Python service follows the same pattern with FastAPI and Pydantic:

```
../python/src/routes/<provider>/
  api/               # Route handlers
  models/            # Pydantic request/response models
  services/          # Business logic and API calls
```

Currently includes LLM completions (multi-provider via [LiteLLM](https://github.com/BerriAI/litellm)) and media downloads (via [yt-dlp](https://github.com/yt-dlp/yt-dlp)). See the [Python service README](../python/README.md) for details.

## Integrations

### Nodes service (TypeScript)

| Category | Providers |
|---|---|
| AI / LLM | OpenAI |
| Video Generation | Luma, Runway, KlingAI, PixVerse, Creatify |
| Audio | ElevenLabs, Deepgram, Audio utilities |
| Communication | SendGrid, Resend, Slack, Twilio, Vapi |
| Web Scraping | Firecrawl, SerpAPI |
| Social | Reddit |
| Media | Video utilities |
| AI Models | Replicate |
| Document | LlamaParse |
| Storage | Google Cloud Storage (signed URLs) |
| Data | Sources, Destinations (workflow runtime primitives) |

### Python service

| Category | Providers |
|---|---|
| AI / LLM | LiteLLM (OpenAI, Anthropic, Cohere, and 100+ providers) |
| Media Downloads | yt-dlp (YouTube, TikTok, Instagram, Twitter/X, SoundCloud, Vimeo) |

## Prerequisites

- Node.js 20+
- pnpm
- ffmpeg (required for audio and video processing)

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env
# Edit .env with your values

# Start in development mode
pnpm dev
```

The service starts on `http://localhost:8080` by default.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | Server port |
| `GOOGLE_CLOUD_PROJECT` | -- | GCP project ID (required for storage operations) |
| `STORAGE_BUCKET` | -- | GCS bucket for file storage (required for media processing) |
| `NODES_BASE_URL` | `http://localhost:8080` | Public base URL of this service |

Individual integrations receive API keys in request bodies, not environment variables. See each provider's documentation for required fields.

## API Documentation

The auto-generated OpenAPI spec is available at `/openapi.json` when the service is running. You can load this into any OpenAPI-compatible tool (Swagger UI, Postman, etc.) to browse available endpoints.

## Deployment

A Dockerfile is included. The image requires ffmpeg, which is installed during the Docker build.

```bash
docker build -t nodes-service .
docker run -p 8080:8080 --env-file .env nodes-service
```

For GCP Cloud Run deployments, see `deploy.example.sh` and `cloudbuild.example.yaml` as starting templates.

## Recipes

The [`../recipes/`](../recipes/) directory contains pre-built workflow templates that demonstrate how to chain integrations together. Each recipe includes a `recipe.json` (full workflow definition) and a `content.md` (walkthrough).

| Recipe | Difficulty | Description |
|---|---|---|
| [AI Content Pipeline](../recipes/ai-content-pipeline/) | Intermediate | Generate a blog post with GPT-4o, extract SEO metadata, and publish to your CMS |
| [Audio Dubbing Pipeline](../recipes/audio-dubbing-pipeline/) | Advanced | Download a video, transcribe, translate into multiple languages, and generate dubbed audio with ElevenLabs |
| [Reddit Trend Radar](../recipes/reddit-trend-radar/) | Intermediate | Scan web, news, and Reddit via SerpAPI, synthesize trends with GPT-4o, and post a digest to Slack |
| [Slack Alert Pipeline](../recipes/slack-alert-pipeline/) | Beginner | Monitor an API endpoint and send formatted Slack alerts when something is wrong |

Recipes automatically appear on the [Graph Compose Recipes page](https://graphcompose.io/recipes) once merged — no database sync or manual registration required. Users can browse, search, filter by difficulty/tags, and import any recipe into the visual builder with one click via "Open in Builder."

See [CONTRIBUTING.md](CONTRIBUTING.md) for the recipe format guide, or [`../recipes/README.md`](../recipes/README.md) for the full specification.

---

## What Happens When You Contribute

Everything in this repository propagates automatically through the Graph Compose platform. No frontend changes, no manual registration, no extra PRs.

### New integration (either service)

When you add a route module — under `src/nodes/routes/<provider>/` (TypeScript) or `../python/src/routes/<provider>/` (Python) — both services auto-generate their `/openapi.json`, and the platform merges them during discovery:

| Surface | What happens |
|---|---|
| **[Nodes SDK Reference](https://www.graphcompose.io/nodes)** | The auto-generated OpenAPI spec is rendered as interactive API docs via Scalar |
| **[Visual Builder](https://graphcompose.io/dashboard)** | The integration appears as a draggable, configurable node in the workflow builder |
| **[AI Workflow Assistant](https://graphcompose.io/dashboard/assistant)** | The doc sync pipeline indexes the new operation into Supabase, so the AI can discover and configure it via semantic search |

### New recipe

When you add a recipe under `../recipes/<slug>/`:

| Surface | What happens |
|---|---|
| **[Recipes page](https://graphcompose.io/recipes)** | The recipe appears in the browsable catalog with search, tag, and difficulty filtering |
| **Recipe detail page** | `/recipes/<slug>` renders the metadata card, workflow preview, and article from `content.md` |
| **Visual Builder** | "Open in Builder" imports the full workflow graph onto the canvas |

---

## LLM-Friendly Codebase

This repository is designed to be easy for LLMs (Cursor, Copilot, Claude, etc.) to work with. Both the TypeScript and Python services follow rigid, repeatable structures, so an LLM can scaffold a complete new integration by referencing any existing one as a template.

**Why it works well with AI code generation:**

- **Uniform directory structure** — TypeScript providers follow `routes/<provider>/{ router.ts, controllers/, services/, schemas/ }`. Python providers follow `routes/<provider>/{ api/, models/, services/ }`. An LLM can copy any existing provider and adapt it.
- **Schema-first design** — TypeScript uses Zod with `zod-openapi` extensions; Python uses Pydantic models. Both are declarative and pattern-matchable — LLMs excel at producing these from API documentation.
- **Self-documenting** — The OpenAPI spec is generated from the schemas in both services, so there's no separate documentation to write or keep in sync. The code _is_ the documentation.
- **Isolated modules** — Each provider is self-contained with no cross-provider dependencies. An LLM can generate a full integration without needing to understand the rest of the codebase.
- **Comprehensive reference** — [`ROUTE_STANDARDS.md`](src/nodes/routes/ROUTE_STANDARDS.md) provides the full specification for TypeScript route modules, making it an ideal system prompt or context document for AI-assisted development.

**Recommended workflow for AI-assisted contributions:**

1. Pick the right service — TypeScript for most API integrations, Python for ML/LLM workloads or when a Python library is required
2. Point your LLM at an existing provider (e.g., `src/nodes/routes/sendgrid/` or `../python/src/routes/llm/`) and the relevant standards doc
3. Provide the target API's documentation (or URL for the LLM to reference)
4. The LLM generates the full route module: router, handlers, service logic, and schemas
5. Run the service and verify the new endpoints appear at `/openapi.json`

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for step-by-step examples of adding integrations and recipes, or [`ROUTE_STANDARDS.md`](src/nodes/routes/ROUTE_STANDARDS.md) for the full route module specification.

## License

This project is dual-licensed:

- **AGPL-3.0** for open-source use. See [LICENSE](../LICENSE) for details.
- **Commercial License** available for organizations that need an alternative to AGPL. Contact the maintainers for details.
