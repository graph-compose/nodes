import {
  ZodOpenApiObject,
  ZodOpenApiPathsObject,
  createDocument,
} from "zod-openapi";
import { createOpenApiDocument as createAudioOpenApiDocument } from "../nodes/routes/audio/schemas/concatSchemas";
import { createOpenApiDocument as createCreatifyOpenApiDocument } from "../nodes/routes/creatify/openapi";
import { createOpenApiDocument as createDeepgramOpenApiDocument } from "../nodes/routes/deepgram/openapi";
import { createOpenApiDocument as createElevenLabsOpenApiDocument } from "../nodes/routes/elevenlabs/openapi";
import { createOpenApiDocument as createFirecrawlOpenApiDocument } from "../nodes/routes/firecrawl/openapi";
import { createOpenApiDocument as createKlingaiOpenApiDocument } from "../nodes/routes/klingai/openapi";
import { createOpenApiDocument as createLlamaParseOpenApiDocument } from "../nodes/routes/llamaparse";
import { createOpenApiDocument as createLumaOpenApiDocument } from "../nodes/routes/luma/openapi";
import { createOpenApiDocument as createOpenaiOpenApiDocument } from "../nodes/routes/openai/openapi";
import { createOpenApiDocument as createPixverseOpenApiDocument } from "../nodes/routes/pixverse/openapi";
import { createOpenApiDocument as createReplicateOpenApiDocument } from "../nodes/routes/replicate/openapi";
import { createOpenApiDocument as createRedditOpenApiDocument } from "../nodes/routes/reddit/openapi";
import { createOpenApiDocument as createResendOpenApiDocument } from "../nodes/routes/resend/openapi";
import { createOpenApiDocument as createRunwayOpenApiDocument } from "../nodes/routes/runway/openapi";
import { createOpenApiDocument as createSendgridOpenApiDocument } from "../nodes/routes/sendgrid/openapi";
import { createOpenApiDocument as createSerpApiOpenApiDocument } from "../nodes/routes/serpapi/openapi";
import { createOpenApiDocument as createSlackOpenApiDocument } from "../nodes/routes/slack/openapi";
import { createOpenApiDocument as createStorageOpenApiDocument } from "../nodes/routes/storage/openapi";
import { createOpenApiDocument as createTwilioOpenApiDocument } from "../nodes/routes/twilio/openapi";
import { createOpenApiDocument as createVapiOpenApiDocument } from "../nodes/routes/vapi/openapi";
import { createOpenApiDocument as createVideoOpenApiDocument } from "../nodes/routes/video/openapi";

// =============================================================================
// Types
// =============================================================================

// Extended OpenAPI interface that includes our custom meta field
export interface ExtendedOpenAPIObject extends ZodOpenApiObject {
  meta?: {
    tags?: string[];
    imageUrl?: string;
    provider?: string;
    category?: string | string[];
    sourceUrl?: string;
  };
}

// All local document creators (synchronous, no external deps)
const LOCAL_DOCUMENT_CREATORS: Array<{
  name: string;
  create: () => ExtendedOpenAPIObject;
}> = [
  {
    name: "Audio",
    create: createAudioOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "SendGrid",
    create: createSendgridOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Luma",
    create: createLumaOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Runway",
    create: createRunwayOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Storage",
    create: createStorageOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Resend",
    create: createResendOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Reddit",
    create: createRedditOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "SerpAPI",
    create: createSerpApiOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Creatify",
    create: createCreatifyOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Deepgram",
    create: createDeepgramOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Replicate",
    create: createReplicateOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "LlamaParse",
    create: createLlamaParseOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Vapi",
    create: createVapiOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "ElevenLabs",
    create: createElevenLabsOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Firecrawl",
    create: createFirecrawlOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "KlingAI",
    create: createKlingaiOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "OpenAI",
    create: createOpenaiOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Pixverse",
    create: createPixverseOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Slack",
    create: createSlackOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Twilio",
    create: createTwilioOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  {
    name: "Video",
    create: createVideoOpenApiDocument as () => ExtendedOpenAPIObject,
  },
  // NOTE: text/sources/destinations routers are intentionally excluded from
  // merged discovery/OpenAPI indexing. They are internal workflow primitives.
];

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
]);

const toOperationId = (method: string, path: string): string => {
  const normalizedPath = path
    .replace(/^\//, "")
    .replace(/[{}]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return `${method.toLowerCase()}_${normalizedPath}`;
};

// =============================================================================
// Document Collection
// =============================================================================

/**
 * Collect all local OpenAPI documents from the registered creators.
 * Each creator is called in a try/catch so one failing module doesn't break the whole spec.
 */
const collectLocalDocuments = (): ExtendedOpenAPIObject[] => {
  const documents: ExtendedOpenAPIObject[] = [];

  for (const { name, create } of LOCAL_DOCUMENT_CREATORS) {
    try {
      documents.push(create());
    } catch (error) {
      console.warn(`Failed to create OpenAPI document for ${name}:`, error);
    }
  }

  return documents;
};

/**
 * Collect all OpenAPI documents.
 * Used by the routes-info endpoint which needs individual docs before merging.
 */
export const collectOpenApiDocuments = async (): Promise<
  ExtendedOpenAPIObject[]
> => {
  return collectLocalDocuments();
};

// =============================================================================
// Merge Logic
// =============================================================================

/**
 * Merge individual OpenAPI documents into a single spec.
 * - Prefixes all paths with /nodes
 * - Merges component schemas
 * - Attaches meta to operations for UI consumption
 * - Does NOT resolve $refs (Scalar/Stoplight handle this natively)
 */
const mergeDocuments = (
  documents: ExtendedOpenAPIObject[],
  baseUrl: string,
): ZodOpenApiObject => {
  const mergedPaths: ZodOpenApiPathsObject = {};
  const mergedSchemas: Record<string, any> = {};

  for (const doc of documents) {
    // Merge paths, prefixing with /nodes if necessary
    for (const [path, pathItem] of Object.entries(doc.paths || {})) {
      let finalPath = path;

      // Ensure all paths start with /nodes
      if (!finalPath.startsWith("/nodes/")) {
        finalPath = `/nodes${finalPath}`;
      }

      // Skip per-route openapi.json meta endpoints — they're not real integration endpoints
      if (finalPath.endsWith("/openapi.json")) continue;

      // Skip duplicates (prefer first encountered)
      if (mergedPaths[finalPath]) continue;

      // Attach meta to each operation for UI consumption
      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          typeof operation === "object" &&
          operation !== null &&
          operation.responses
        ) {
          // Attach route-level metadata for UI/assistant consumption.
          if (doc.meta) {
            operation["meta"] = doc.meta;
          }

          // Ensure every operation has a stable operationId.
          if (
            HTTP_METHODS.has(method) &&
            (typeof operation.operationId !== "string" ||
              operation.operationId.length === 0)
          ) {
            operation.operationId = toOperationId(method, finalPath);
          }
        }
      }

      mergedPaths[finalPath] = pathItem;
    }

    // Merge component schemas
    if (doc.components?.schemas) {
      Object.assign(mergedSchemas, doc.components.schemas);
    }
  }

  const mergedDocument = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Graph Compose Nodes API",
      version: "1.0.0",
      description: `## Getting Started with Graph Compose Node APIs

Welcome to the API reference for Graph Compose's Managed Nodes! This documentation provides detailed information about the available endpoints for invoking pre-built integrations and utility functions within your Graph Compose workflows.

These nodes act as building blocks, allowing you to easily interact with external services (like SendGrid for email) or perform common tasks (like cloud storage operations) directly from your workflow graphs.

<br />

---

<br />

## API Reference vs. Guides & Workflow API

**This documentation focuses specifically on the individual Node API endpoints, their request/response schemas, and any node-specific authentication (like API keys passed in the request body).**

- For guides, tutorials, core platform concepts, or quickstart examples, please refer to our main documentation site:
  **[https://graphcompose.io/docs](https://graphcompose.io/docs)**

- For documentation on managing the overall workflows (creating, executing, validating, managing state), please refer to the Workflow API documentation:
  **[https://graphcompose.io/workflow](https://graphcompose.io/workflow)**

<br />

---

<br />

## Available Node Endpoints

You can browse the available node endpoints in the sidebar of this documentation. Each corresponds to a specific integration or utility.

These endpoints allow you to perform actions like:

- **Sending Emails:** Utilize integrations like SendGrid to send transactional or marketing emails.
- **Cloud Storage Operations:** Generate signed URLs, transfer files, or write content to cloud storage providers.
- **Video Processing:** Extract audio or frames from videos.
- **AI Operations:** Interact with services like OpenAI, Replicate, Luma, Runway, etc.
- **(And many more - see sidebar for the full list!)**

Each path is structured as \`/nodes/<provider_or_utility_name>/<action>\` (e.g., \`/nodes/sendgrid/send\`, \`/nodes/storage/transfer/url\`).

<br />

---

<br />

## Authentication

Authentication for these node endpoints is handled **per node**, if required by the underlying service.

- **No Platform-Level Token:** Unlike the main Graph Compose Workflow API, these \`/nodes/...\` endpoints do **not** require an \`Authorization: Bearer\` token in the header.
- **Node-Specific Credentials:** Some nodes (e.g., SendGrid, OpenAI, Replicate) require you to pass their specific API key or credentials within the JSON request body. Please refer to the documentation for each specific endpoint below to see its authentication requirements.
- **Public Nodes:** Other utility nodes (e.g., Storage, Video Utils, YTDL) may not require any specific credentials.

Always check the \`requestBody\` schema definition for a specific endpoint to confirm if any credentials like an \`apiKey\` are needed.

<br />

---
`,
    },
    servers: [
      {
        url: baseUrl,
        description:
          baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")
            ? "Local development server"
            : "Graph Compose Nodes API",
      },
    ],
    paths: mergedPaths,
    components: {
      schemas: mergedSchemas,
    },
  }) as ZodOpenApiObject;

  return mergedDocument;
};

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate the merged OpenAPI document for all nodes.
 *
 * Collects all local router specs and the LLM spec (cached with TTL),
 * merges them into a single OpenAPI 3.1.0 document.
 *
 * @param baseUrl - Override the server URL in the spec (useful for local dev)
 */
export const generateMergedOpenApiDocument = async (
  baseUrl?: string,
): Promise<ZodOpenApiObject> => {
  const serverUrl = baseUrl || "https://nodes.graphcompose.io";

  const documents = await collectOpenApiDocuments();

  return mergeDocuments(documents, serverUrl);
};
