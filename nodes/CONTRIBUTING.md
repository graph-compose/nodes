# Contributing to Graph Compose Nodes

Thank you for your interest in contributing. This document explains how to add integrations, recipes, and fixes.

## How Integrations Work

Every integration in this service is auto-surfaced to users through OpenAPI. When you add a new route module:

1. Your Zod schemas generate an OpenAPI spec with metadata (provider name, category, icon)
2. The spec is merged into the service-wide `/openapi.json` endpoint
3. The Graph Compose UI fetches this spec and renders your integration as a draggable node in the workflow builder
4. Users can configure your integration through auto-generated forms driven by your schemas

This means a well-structured route module with good schemas is all it takes to ship a new integration end-to-end.

## OpenAPI Contract (Required)

This service participates in multi-service discovery, so each operation must satisfy the shared contract:

- `operationId` is required and should be stable.
- Metadata is required on each operation via service-level `meta` injection:
  - `tags: string[]`
  - `category: string`
  - `provider: string`
- Optional metadata:
  - `imageUrl`
  - `sourceUrl`

Run the live contract test before opening a PR:

```bash
pnpm run test:openapi-contract:live
```

## Adding a New Integration

Each integration lives in its own directory under `src/nodes/routes/<provider>/`:

```
src/nodes/routes/example-api/
  router.ts          # Express router with validation middleware
  controllers/
    exampleController.ts
  services/
    exampleService.ts
  schemas/
    exampleSchemas.ts
  openapi.ts         # OpenAPI doc with metadata
```

### 1. Define schemas (`schemas/exampleSchemas.ts`)

Use Zod with `.openapi()` extensions for documentation:

```typescript
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";

extendZodWithOpenApi(z);

export const ExampleRequestSchema = z.object({
  apiKey: z.string().openapi({ description: "Your ExampleAPI key" }),
  query: z.string().openapi({ description: "Search query", example: "graph compose" }),
}).openapi({ ref: "ExampleRequest" });

export const ExampleResultDataSchema = z.object({
  results: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })).openapi({ description: "Search results" }),
}).passthrough();
```

### 2. Write the service (`services/exampleService.ts`)

Isolate all external API calls here:

```typescript
export class ExampleService {
  async search(apiKey: string, query: string) {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new Error(`ExampleAPI error: ${response.status}`);
    return response.json();
  }
}

export const exampleService = new ExampleService();
```

### 3. Create the controller (`controllers/exampleController.ts`)

Keep controllers thin -- extract data, call the service, return the response:

```typescript
import { Request, Response } from "express";
import { z } from "zod";
import { ExampleRequestSchema } from "../schemas/exampleSchemas";
import { exampleService } from "../services/exampleService";

export const search = async (req: Request<{}, Response, z.infer<typeof ExampleRequestSchema>>, res: Response) => {
  try {
    const { apiKey, query } = req.body;
    const result = await exampleService.search(apiKey, query);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
```

### 4. Wire up the router (`router.ts`)

```typescript
import { Router } from "express";
import { validate } from "express-zod-safe";
import { ExampleRequestSchema } from "./schemas/exampleSchemas";
import * as exampleController from "./controllers/exampleController";
import { openApiDoc } from "./openapi";

const router = Router();

router.post("/search", validate({ body: ExampleRequestSchema }), exampleController.search);
router.get("/openapi.json", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(openApiDoc);
});

export default router;
```

### 5. Add OpenAPI metadata (`openapi.ts`)

Export a `createOpenApiDocument` function using `createDocument` from `zod-openapi`. The `meta` field controls how your integration appears in the UI — provider name, category, and icon:

```typescript
import { createDocument } from "zod-openapi";
import { ExampleRequestSchema, ExampleResponseSchema } from "./schemas/exampleSchemas";

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: { title: "ExampleAPI", version: "1.0.0" },
    paths: {
      "/example-api/search": {
        post: {
          summary: "Search ExampleAPI",
          description: "What this endpoint does and when to use it.\n\n**Authentication:** Pass your API key in the `apiKey` field of the request body.",
          operationId: "example_api_search",
          tags: ["Web Scraping"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: ExampleRequestSchema } },
          },
          responses: {
            "200": {
              description: "Success",
              content: { "application/json": { schema: ExampleResponseSchema } },
            },
            "500": { description: "Service error" },
          },
        },
      },
    },
  });

  return {
    ...document,
    meta: {
      tags: ["search", "web scraping"],
      provider: "ExampleAPI",
      category: "Web Scraping",
      imageUrl: "https://example.com/logo.png",
      sourceUrl: "https://example.com/docs",
    },
  };
};
```

Update `router.ts` to call the function rather than export a static object:

```typescript
import { createOpenApiDocument } from "./openapi";

router.get("/openapi.json", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json(createOpenApiDocument());
});
```

### 6. Mount the router

Add your router to `src/nodes/routes/index.ts`:

```typescript
import exampleRouter from "./example-api/router";
apiRouter.use("/example-api", exampleRouter);
```

### 7. Register the OpenAPI document

Add your `createOpenApiDocument` to `LOCAL_DOCUMENT_CREATORS` in `src/docs/index.ts`. This is what merges your spec into `/nodes/openapi.json` and surfaces your node in the Graph Compose UI:

```typescript
import { createOpenApiDocument as createExampleApiOpenApiDocument } from "../nodes/routes/example-api/openapi";

const LOCAL_DOCUMENT_CREATORS = [
  // ... existing entries
  {
    name: "ExampleAPI",
    create: createExampleApiOpenApiDocument as () => ExtendedOpenAPIObject,
  },
];
```

For the full specification, see `src/nodes/routes/ROUTE_STANDARDS.md`.

## Contributing Recipes

Recipes are pre-built workflow templates that demonstrate how to chain integrations together. They live in `../recipes/<slug>/` and contain two files:

```
../recipes/<slug>/
  recipe.json    # Workflow definition and metadata
  content.md     # Walkthrough article
```

### recipe.json

Required fields: `slug`, `title`, `description`, `author`, `tags`, `difficulty`, `publishedAt`, `requiredSecrets`, `requiredServices`, `relatedRecipes`, `relatedBlogPosts`, `workflow`. Leave `imageSrc` and `imageAlt` as `""` -- maintainers will generate header images.

Rules:
- Use `{{ secrets.NAME }}` for credentials in `workflow.context` -- never hardcode real keys
- Use realistic but safe placeholder values for non-secret context
- Keep node IDs descriptive and snake_case
- List every secret in both `requiredSecrets` and `workflow.context`

### content.md

Structure: `# Title` > overview > `## Node breakdown` (one `###` per node) > `## Key patterns` > `## Customizing` > `## Required setup`.

Link nodes to their source code using relative paths:

```markdown
### `search_web`: [serpapi/search](../../src/nodes/routes/serpapi)
### `summarize`: [openai/chat](../../src/nodes/routes/openai)
```

See existing recipes in `../recipes/` for complete examples.

## Reporting Issues

Use the provided issue templates:
- **Bug Report** -- for reproducible problems with existing functionality
- **Feature Request** -- for new integrations or capabilities
- **Recipe Request** -- for new recipe ideas or improvements

Include as much detail as possible. For bugs, include steps to reproduce, expected vs actual behavior, and relevant logs.

## Submitting Pull Requests

1. Fork this repository
2. Create a feature branch from `main`
3. Make your changes
4. Test locally (see below)
5. Open a pull request against `main`

### Code Style

- TypeScript with strict mode
- Zod schemas for all request/response validation
- Follow the patterns in `src/nodes/routes/ROUTE_STANDARDS.md` when adding new integrations
- Each integration should include an OpenAPI spec (via zod-openapi)
- Keep controllers thin -- business logic belongs in services

### Testing Locally

Before submitting:
- The service should start without errors: `pnpm dev`
- Your endpoints should respond correctly
- The OpenAPI spec at `/openapi.json` should include your new routes
- The live OpenAPI contract test should pass: `pnpm run test:openapi-contract:live`
- Run the linter: `pnpm lint`

### DCO Sign-Off

All commits must include a `Signed-off-by` line, certifying that you have the right to submit the code under the project's license ([Developer Certificate of Origin](https://developercertificate.org/)).

```bash
git commit -s -m "Add new integration for ExampleAPI"
```

This produces: `Signed-off-by: Your Name <your.email@example.com>`

## Code Review

- All PRs require at least one maintainer approval
- Maintainers may request changes or suggest alternative approaches
- Be patient -- reviews may take a few days

## Questions

If you have questions about contributing, open a discussion or reach out via an issue.
