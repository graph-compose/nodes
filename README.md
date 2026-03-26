# Graph Compose Nodes

The open-source integration and recipe layer for [Graph Compose](https://graphcompose.io) — a visual workflow orchestration platform built on [Temporal](https://temporal.io).

This repository contains:

- **[`nodes/`](./nodes/)** — TypeScript/Express service exposing 25+ third-party API integrations as standardized REST endpoints
- **[`python/`](./python/)** — FastAPI service exposing Python-backed endpoints (LLM, media processing, etc.)
- **[`recipes/`](./recipes/)** — Reusable workflow templates that chain nodes together to solve real tasks

---

## How It Fits Together

Graph Compose lets you build workflows visually by connecting nodes on a canvas. Each node in the builder maps to an API endpoint in this repository. When a workflow executes on Temporal, the runtime calls these endpoints to interact with external services — sending emails, generating video, transcribing audio, and more.

```
┌─────────────────────────────────────┐
│  Graph Compose Visual Builder (UI)  │
│                                     │
│   ┌──────┐    ┌──────┐    ┌──────┐ │
│   │ Node │───▶│ Node │───▶│ Node │ │
│   └──────┘    └──────┘    └──────┘ │
└─────────────┬───────────────────────┘
              │ workflow execution
              ▼
┌─────────────────────────────────────┐
│  Graph Compose Runtime (Temporal)   │
└─────────────┬───────────────────────┘
              │ HTTP calls
              ▼
┌─────────────────────────────────────┐
│  This Repository                    │
│  nodes/ service  +  python/ service │
│  (REST API integrations)            │
└─────────────────────────────────────┘
```

### Automatic Propagation

Every integration in this repository is defined with Zod schemas that auto-generate an OpenAPI spec served at `/openapi.json`. That single spec is the source of truth that feeds three downstream surfaces — no manual registration or frontend changes required:

| Surface | What happens | Link |
|---|---|---|
| **Nodes SDK Reference** | The OpenAPI spec is rendered as interactive API documentation via [Scalar](https://scalar.com) | [graphcompose.io/nodes](https://www.graphcompose.io/nodes) |
| **Visual Builder** | The builder's node catalog fetches available integrations from the same OpenAPI spec at runtime, so new routes appear as draggable nodes automatically | [graphcompose.io/dashboard](https://graphcompose.io/dashboard) |
| **AI Workflow Assistant** | A documentation sync pipeline indexes OpenAPI operations into Supabase with vector embeddings, so the AI assistant can discover and correctly configure new integrations via semantic search | [graphcompose.io/dashboard/assistant](https://graphcompose.io/dashboard/assistant) |

```
nodes/src/nodes/routes/<provider>/
  schemas/  ← Zod schemas with zod-openapi extensions
      │
      ▼
  /openapi.json  (auto-generated at runtime)
      │
      ├──▶  graphcompose.io/nodes        (Scalar API Reference)
      ├──▶  Visual Builder node catalog   (OpenAPI discovery)
      └──▶  AI Assistant knowledge base   (semantic search via Supabase)
```

<!-- TODO: Add screenshot of the visual builder showing node selection panel -->
<!-- TODO: Add screenshot of the Scalar API reference at graphcompose.io/nodes -->

### Recipes on graphcompose.io

Recipes are pre-built workflow templates stored in [`recipes/`](./recipes/). They appear on the public [Recipes page](https://graphcompose.io/recipes) as a browsable catalog with search, tag filtering, and difficulty levels. Each recipe can be imported directly into the visual builder with one click via "Open in Builder."

<!-- TODO: Add screenshot of the /recipes catalog page -->
<!-- TODO: Add screenshot of a recipe detail page showing the "Open in Builder" button -->

---

## Available Integrations

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

## Available Recipes

| Recipe | Difficulty | Description |
|---|---|---|
| [AI Content Pipeline](./recipes/ai-content-pipeline/) | Intermediate | Generate a blog post with GPT-4o, extract SEO metadata, and publish to your CMS |
| [Audio Dubbing Pipeline](./recipes/audio-dubbing-pipeline/) | Advanced | Download a video, transcribe, translate into multiple languages, and generate dubbed audio with ElevenLabs |
| [Reddit Trend Radar](./recipes/reddit-trend-radar/) | Intermediate | Scan web, news, and Reddit via SerpAPI, synthesize trends with GPT-4o, and post a digest to Slack |
| [Slack Alert Pipeline](./recipes/slack-alert-pipeline/) | Beginner | Monitor an API endpoint and send formatted Slack alerts when something is wrong |

Browse and import recipes at [graphcompose.io/recipes](https://graphcompose.io/recipes).

---

## Local Development

### Nodes service (TypeScript/Express)

```bash
cd nodes
pnpm install
cp .env.example .env   # then edit with your values
pnpm dev
```

Default local URL: `http://localhost:8080`

### Python service (FastAPI)

```bash
cd python
source ./venv/bin/activate
uvicorn src.app:app --reload --port 8090
```

Default local URL: `http://localhost:8090`

### OpenAPI Endpoints

- Nodes: `GET /openapi.json`
- Python: `GET /openapi.json`

---

## Contract Checks

Both services enforce the same OpenAPI compatibility contract:

- `servers[0].url` is present and absolute
- Every operation has `operationId`
- Every operation has metadata fields (`tags`, `category`, `provider`) via service metadata injection
- No duplicate `path + method` or duplicate `operationId` in merged discovery

```bash
# Nodes service
cd nodes && pnpm run test:openapi-contract:live

# Python service
cd python && python src/tests/openapi_contract_live_test.py
```

Set `STRICT_OPENAPI_CONTRACT=0` for non-strict warning mode during local debugging.

---

## Contributing

When you add a route module with Zod schemas, the integration is automatically surfaced across the entire Graph Compose ecosystem — the [SDK reference](https://www.graphcompose.io/nodes), the [visual builder](https://graphcompose.io/dashboard), and the [AI assistant](https://graphcompose.io/dashboard/assistant) all pick it up without any manual wiring. See [Automatic Propagation](#automatic-propagation) above for details.

- **Adding an integration:** See [`nodes/CONTRIBUTING.md`](./nodes/CONTRIBUTING.md) for step-by-step examples and [`nodes/src/nodes/routes/ROUTE_STANDARDS.md`](./nodes/src/nodes/routes/ROUTE_STANDARDS.md) for the full route module specification.
- **Adding a recipe:** See [`recipes/README.md`](./recipes/README.md) for the recipe format guide and validation checklist.

---

## Related Repositories

| Repository | Description |
|---|---|
| [@graph-compose/core](https://github.com/graph-compose/core) | Workflow graph types and Zod schemas |
| [@graph-compose/client](https://github.com/graph-compose/client) | Node.js SDK for the Graph Compose API |
| [@graph-compose/runtime](https://github.com/graph-compose/runtime) | Temporal-based workflow execution runtime |
| [@graph-compose/execution-kernel](https://github.com/graph-compose/execution-kernel) | Low-level execution engine for graph evaluation |

---

## License

This project is dual-licensed:

- **AGPL-3.0** for open-source use. See [LICENSE](./LICENSE) for details.
- **Commercial License** available for organizations that need an alternative to AGPL. Contact the maintainers for details.
