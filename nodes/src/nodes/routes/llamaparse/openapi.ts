import { z } from "zod";
import {
  createDocument,
  extendZodWithOpenApi,
  ZodOpenApiObject,
} from "zod-openapi";
import {
  ApiErrorResponseSchema,
  CreateParseJobRequestSchema,
  CreateParseJobResponseSchema,
  GetParseJobResultRequestSchema,
  GetParseJobResultResponseSchema,
  GetParseJobStatusRequestSchema,
  GetParseJobStatusResponseSchema,
} from "./schemas/schema";

extendZodWithOpenApi(z);

export const createOpenApiDocument = (): ZodOpenApiObject => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "LlamaParse Node API",
      version: "1.0.0",
      description:
        "API endpoints for parsing documents using the LlamaParse REST API. All endpoints use POST and expect parameters in the request body.",
    },
    paths: {
      "/llamaparse/parse": {
        post: {
          summary: "Start LlamaParse Document Parsing Job",
          description: `Uploads a document file (via URL) and initiates an asynchronous parsing job using the LlamaParse API.

**NOTE:** The full path for this endpoint is **/nodes/llamaparse/parse**

**AUTHENTICATION:**
- Requires a LlamaCloud API Key (\`llx-...\`). Provide it in the \`apiKey\` field of the JSON request body.

**WORKFLOW (Asynchronous):**
1. Submit a POST request to this endpoint (\`/nodes/llamaparse/parse\`) with \`apiKey\` and \`fileUrl\` in the JSON body.
2. The service downloads the file from the URL temporarily.
3. The file is uploaded to the LlamaParse /upload endpoint.
4. A JSON response (200 OK) is returned containing the \`jobId\` (\`data.jobId\`).
5. Use the \`jobId\` with the POST \`/nodes/llamaparse/status\` endpoint to check progress.
6. Once status is "SUCCESS", use the \`jobId\` with POST \`/nodes/llamaparse/result\` to retrieve the final content.
7. Temporary files are cleaned up automatically.

**ERROR HANDLING:**
- Returns 500 response (using the standard error format) if any step fails (download, upload, API interaction).
- Validation errors (400) for the request body are handled by middleware before this endpoint logic is reached. Check the \`message\` and \`error.details\` fields in the response.`,
          tags: ["LlamaParse"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: CreateParseJobRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description: "Job creation request accepted.",
              content: {
                "application/json": {
                  schema: CreateParseJobResponseSchema,
                },
              },
            },
            "500": {
              description:
                "Error creating job (Internal Server Error or Service Error).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/llamaparse/status": {
        post: {
          summary: "Get LlamaParse Parsing Job Status",
          description: `Checks the status of an ongoing LlamaParse job.

**NOTE:** The full path for this endpoint is **/nodes/llamaparse/status**

**AUTHENTICATION:**
- Requires a LlamaCloud API Key (\`llx-...\`). Provide it in the \`apiKey\` field of the JSON request body.

**PARAMETERS:**
- Provide \`apiKey\` and \`jobId\` in the JSON request body.`,
          tags: ["LlamaParse"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: GetParseJobStatusRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description: "Job status retrieved successfully.",
              content: {
                "application/json": {
                  schema: GetParseJobStatusResponseSchema,
                },
              },
            },
            "500": {
              description:
                "Error retrieving job status (Internal Server Error or Service Error).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/llamaparse/result": {
        post: {
          summary: "Get LlamaParse Parsing Job Result",
          description: `Retrieves the parsed content of a completed LlamaParse job.

**NOTE:** The full path for this endpoint is **/nodes/llamaparse/result**

- It is recommended to check the job status using POST \`/nodes/llamaparse/status\` first. This endpoint will return an error if the job status is not \\"SUCCESS\\".

**AUTHENTICATION:**
- Requires a LlamaCloud API Key (\`llx-...\`). Provide it in the \`apiKey\` field of the JSON request body.

**PARAMETERS:**
- Provide \`apiKey\` and \`jobId\` in the JSON request body.
- Optionally include \`resultFormat\` ('markdown' or 'text', default: 'markdown') in the body.`,
          tags: ["LlamaParse"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: GetParseJobResultRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description: "Parsed content retrieved successfully.",
              content: {
                "application/json": {
                  schema: GetParseJobResultResponseSchema,
                },
              },
            },
            "400": {
              description: "Bad Request (e.g., job status is not SUCCESS).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "500": {
              description:
                "Error retrieving job result (Internal Server Error or Service Error).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
    },
  });

  // Add required metadata according to ROUTE_STANDARDS.md
  return {
    ...document,
    meta: {
      tags: ["LlamaParse"],
      provider: "LlamaIndex (LlamaParse)",
      category: "Document Processing",
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/llama-index-logo.jpeg",
      sourceUrl:
        "https://docs.cloud.llamaindex.ai/llamaparse/getting_started/api",
      async: true,
      complexity: "medium",
    },
  } as ZodOpenApiObject;
};
