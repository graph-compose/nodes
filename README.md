# Graph Compose Nodes

This repository contains the managed node services and reusable workflow recipes used in Graph Compose.

It contains:

- `nodes/` - TypeScript/Express service exposing `/nodes/*` integration endpoints
- `python/` - FastAPI service exposing python-backed endpoints (for example `/llm/*`, `/ytdl/*`)
- `recipes/` - reusable workflow templates (`recipe.json` + `content.md`)

## Repository Layout

```text
cloud-run/graph-compose-nodes/
  nodes/
  python/
  recipes/
```

## Local Development

### Nodes service

```bash
cd nodes
pnpm install
pnpm dev
```

Default local URL: `http://localhost:3009`

### Python service

```bash
cd python
source ./venv/bin/activate
uvicorn src.app:app --reload --port 8090
```

Default local URL: `http://localhost:8090`

## OpenAPI Endpoints

- Nodes: `GET /nodes/openapi.json`
- Python: `GET /openapi.json`

## Contract Checks

The same OpenAPI compatibility contract is required for **both** services (`nodes` and `python`):

- `servers[0].url` is present and absolute
- every operation has `operationId`
- every operation has metadata fields (`tags`, `category`, `provider`) via service metadata injection
- no duplicate `path + method` or duplicate `operationId` in merged discovery

Current live contract checks:

```bash
# Nodes service (strict by default)
cd nodes
pnpm run test:openapi-contract:live
 
# Python service (strict by default)
cd ../python
python src/tests/openapi_contract_live_test.py
```

To run in non-strict warning mode (local debugging only), set:

- `STRICT_OPENAPI_CONTRACT=0`
## Recipes

Recipes are located at the repository root under `recipes/`.

Each recipe folder contains:

- `recipe.json` - structured workflow payload and metadata
- `content.md` - human-readable walkthrough

See `recipes/README.md` for contribution requirements and validation steps.
