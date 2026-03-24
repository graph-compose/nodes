# Graph Compose Nodes

An Express.js/TypeScript microservice that provides 25+ third-party API integrations as standardized REST endpoints. Each integration uses Zod validation for request/response schemas, with OpenAPI specs auto-generated from those schemas.

This service powers the integration layer of [Graph Compose](https://graphcompose.io), a workflow orchestration platform built on Temporal. When a workflow executes, each node in the graph calls this service to interact with external APIs -- sending emails via SendGrid, generating video with Runway, transcribing audio with Deepgram, and more.

You can see these integrations in action through the [Graph Compose Recipes](https://graphcompose.io/recipes), which are pre-built workflow templates that chain multiple nodes together to solve real tasks like trend monitoring, content generation, and media processing pipelines. Recipes are included in this repository under [`../recipes/`](../recipes/).

## Architecture

The service is organized as an Express app with route modules per provider. Each module follows a standard structure:

```
src/nodes/routes/<provider>/
  router.ts          # Route definitions
  controllers/       # Request handlers
  services/          # Business logic and API calls
  schemas/           # Zod schemas with zod-openapi extensions
```

OpenAPI specs are auto-generated per route module and merged into a single spec served at `/openapi.json`.

## Integrations

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

Browse and import recipes from the [Graph Compose Recipes page](https://graphcompose.io/recipes), or see [CONTRIBUTING.md](CONTRIBUTING.md) for the recipe format guide.

## Contributing

New integrations are automatically surfaced in the Graph Compose UI. When you add a route module with Zod schemas and an OpenAPI spec, the UI picks it up and renders it as a configurable node in the workflow builder -- no frontend changes needed.

See [CONTRIBUTING.md](CONTRIBUTING.md) for step-by-step examples of adding integrations and recipes, or `src/nodes/routes/ROUTE_STANDARDS.md` for the full route module specification.

## License

Apache 2.0
