import { createDocument } from "zod-openapi";
import "zod-openapi/extend"; // Ensure Zod Open API extensions are loaded
import { HTTP_STATUS } from "../../../types/api-response";
import {
  GenerateVideoRequestBodySchema,
  TaskActionRequestBodySchema,
} from "./schemas/requestSchemas";
import {
  GenerateVideoResponseSchema,
  GetTaskStatusResponseSchema,
  RunwayApiErrorResponseSchema,
} from "./schemas/responseSchemas";

const RUNWAY_API_VERSION = "2024-11-06";

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "RunwayML Video Generation API",
      version: "1.0.0",
      description: `AI-powered service for generating videos from images or text using RunwayML's advanced models.

Key Features:
- Image-to-video generation
- Multiple model variants (e.g., \`gen3a_turbo\`)
- Control over duration, resolution, and seed
- Optional watermark control
- Asynchronous task management with status polling

Getting Started:
1. Obtain a RunwayML API key
2. Use the \`/runway/generate\` endpoint to start a generation task
3. Poll the \`/runway/status/{id}\` endpoint to track progress
4. Retrieve video URL upon successful completion
5. Optionally, use \`/runway/cancel/{id}\` to abort tasks

API Version: Requires \`x-runway-version\` header set to \`${RUNWAY_API_VERSION}\`

For detailed API documentation, visit: https://api.dev.runwayml.com/`,
    },
    externalDocs: {
      description: "RunwayML API Documentation",
      url: "https://api.dev.runwayml.com/",
    },
    paths: {
      // Path keys MUST include the service name prefix
      "/runway/generate": {
        post: {
          summary: "Initiate RunwayML video generation",
          description: `Starts an asynchronous task to generate a video based on input image and/or text prompt.

Workflow:
1. Submit Generation Request
   - Provide API key in the body (\`apiKey\`)
   - Include input image (\`promptImage\`) and optionally text (\`promptText\`)
   - Specify parameters like \`duration\`, \`ratio\`, \`seed\`
   - Set the required \`x-runway-version\` header

2. Handle Response
   - Receive a unique task ID (\`data.id\`)
   - Initial status will be \`PENDING\` or \`THROTTLED\`

3. Monitor Progress
   - Use the task ID to poll the \`/runway/status/{id}\` endpoint
   - Continue polling until status is \`SUCCEEDED\`, \`FAILED\`, or \`CANCELLED\`

Tips:
- Ensure input image URLs are accessible
- Use a high-quality input image for better results
- Vary the \`seed\` for different outputs with the same prompt
- Handle rate limiting based on response headers`,
          tags: ["RunwayML"],
          requestBody: {
            required: true,
            description:
              "Parameters for video generation including API key, input image/text, model, and options",
            content: {
              "application/json": {
                schema: GenerateVideoRequestBodySchema,
              },
            },
          },
          parameters: [
            {
              name: "x-runway-version",
              in: "header",
              required: true,
              description: `Required API version header`,
              schema: {
                type: "string",
                const: RUNWAY_API_VERSION, // Use const for literal value
                example: RUNWAY_API_VERSION,
              },
            },
          ],
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Video generation task successfully initiated",
              content: {
                "application/json": {
                  schema: GenerateVideoResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description: `Request validation failed. Common causes:
- Missing or invalid API key
- Missing or invalid \`x-runway-version\` header
- Invalid input image URL or format
- Prompt text exceeds 512 characters
- Invalid parameter values`,
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed - invalid API key",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description: `Valid request but generation failed to start. Common causes:
- Rate limit exceeded
- Account restrictions
- Content policy violation`,
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Internal Server Error or Runway service error",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.SERVICE_UNAVAILABLE)]: {
              description: "Runway service is temporarily unavailable",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      // Full path will be /nodes/runway/status/{id}
      "/runway/status/{id}": {
        // Kept as POST to match original implementation & avoid breaking changes
        post: {
          summary: "Check RunwayML task status",
          description: `Retrieves the current status and results of a RunwayML generation task.

Workflow:
1. Submit Status Request
   - Provide the task ID from the \`/runway/generate\` response in the URL path (\`{id}\`)
   - Include API key in the request body (\`apiKey\`)

2. Interpret Response
   - Check the \`status\` field:
     - \`PENDING\`/\`THROTTLED\`: Task is queued
     - \`RUNNING\`: Generation in progress (check \`progress\` field)
     - \`SUCCEEDED\`: Task completed, video URL in \`output\` array
     - \`FAILED\`: Error occurred (check \`failure\` and \`failureCode\`)
     - \`CANCELLED\`: Task was aborted

3. Polling Strategy
   - Poll every 5-10 seconds initially
   - Implement backoff for longer tasks
   - Stop polling once a terminal state is reached
   - Handle rate limits

Tips:
- Cache results for terminal states
- Implement timeouts for polling loops
- Log failure reasons for debugging`,
          tags: ["RunwayML"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "The unique ID of the task to check",
              schema: {
                type: "string",
                example: "task_abc123xyz789",
              },
            },
          ],
          requestBody: {
            required: true,
            description: "Requires API key for authentication",
            content: {
              "application/json": {
                schema: TaskActionRequestBodySchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Current task status and results (if available)",
              content: {
                "application/json": {
                  schema: GetTaskStatusResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description: "Invalid task ID format",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Invalid or missing API key",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description: "Task with the specified ID not found",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Server error while retrieving task status",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      // Full path will be /nodes/runway/cancel/{id}
      "/runway/cancel/{id}": {
        // Kept as POST to match original implementation & avoid breaking changes
        post: {
          summary: "Cancel RunwayML generation task",
          description: `Attempts to cancel a \`PENDING\`, \`THROTTLED\`, or \`RUNNING\` RunwayML task.

Workflow Context:
- Call this if you need to stop a task before completion
- Use the task ID obtained from the \`/runway/generate\` endpoint
- Provide API key in the request body (\`apiKey\`)

Response:
- Success (\`204 No Content\`): The cancellation request was accepted. Note that the task might still complete if cancellation is too late.
- Errors (4xx/5xx): Indicates issues like invalid ID, authentication failure, or server problems.

Tips:
- Best effort: Cancellation is not guaranteed if the task is already processing or finished.
- Check status after cancellation request to confirm final state.`,
          tags: ["RunwayML"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "The unique ID of the task to cancel",
              schema: {
                type: "string",
                example: "task_abc123xyz789",
              },
            },
          ],
          requestBody: {
            required: true,
            description: "Requires API key for authentication",
            content: {
              "application/json": {
                schema: TaskActionRequestBodySchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.NO_CONTENT)]: {
              description: "Task cancellation request accepted successfully",
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description: "Invalid task ID format",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Invalid or missing API key",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description: "Task with the specified ID not found",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Server error during cancellation attempt",
              content: {
                "application/json": {
                  schema: RunwayApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
    },
    // Components section will be implicitly generated by createDocument
    components: {
      // Schemas are automatically added by zod-openapi based on references in paths
    },
  });

  // Add custom metadata
  return {
    ...document,
    meta: {
      tags: ["ai", "video", "generation", "image-to-video", "runwayml"],
      provider: "RunwayML",
      category: "video",
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/runway-logo.png", // Updated logo URL
      sourceUrl: "https://runwayml.com/",
      description: `RunwayML provides AI-powered tools for creative tasks, including advanced video generation from images or text.

Key Features:
- High-quality image-to-video generation
- Customizable parameters (\`duration\`, \`resolution\`, \`seed\`)
- Asynchronous task management
- Watermark control
- Support for various input image formats

Use Cases:
- Bringing still images to life
- Creating dynamic marketing content
- Generating short video clips for social media
- Visual storytelling
- Artistic exploration`,
      features: [
        "Image-to-video generation",
        "Text prompt guidance",
        "Customizable duration (`5s`, `10s`)",
        "Selectable resolution",
        "Seed control for reproducibility",
        "Asynchronous task polling",
        "Watermark removal option",
      ],
      pricing: "Usage-based pricing based on video generation time/credits",
      documentation: "https://api.dev.runwayml.com/",
      support: "https://support.runwayml.com/", // Update if specific support link exists
    },
  };
};
