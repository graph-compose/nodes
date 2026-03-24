import { createDocument } from "zod-openapi";
import "zod-openapi/extend"; // Ensure this is imported if schemas use .openapi()

import {
  CreateImageGenerationRequestSchema,
  // Request Schemas
  CreateVideoGenerationRequestSchema,
  GetImageGenerationBodySchema,
  GetVideoGenerationBodySchema,
  ImageGenerationResultDataSchema,
  // ListImageGenerationsBodySchema, // Removed
  // ListImageGenerationsResultDataSchema, // Removed
  // ListVideoGenerationsBodySchema, // Removed
  // ListVideoGenerationsResultDataSchema, // Removed
  // Response Schemas (assuming SuccessResponseSchema wraps these)
  VideoGenerationResultDataSchema,
} from "./schemas/lumaSchemas";

// Import the base response wrappers
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
  SuccessResponseSchema,
} from "../../../types/api-response"; // Corrected import path

// Common tags for this node
const LUMA_TAGS = ["Luma AI"];

// Define the derived success response schemas explicitly, adding tags
const VideoGenerationResponseSchema = SuccessResponseSchema(
  VideoGenerationResultDataSchema,
).openapi({ "x-tags": LUMA_TAGS });
/* Removed List Schemas
const ListVideoGenerationsResponseSchema = SuccessResponseSchema(
  ListVideoGenerationsResultDataSchema,
);
*/
const ImageGenerationResponseSchema = SuccessResponseSchema(
  ImageGenerationResultDataSchema,
).openapi({ "x-tags": LUMA_TAGS });
/* Removed List Schemas
const ListImageGenerationsResponseSchema = SuccessResponseSchema(
  ListImageGenerationsResultDataSchema,
);
*/

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Luma AI Video & Image Generation API",
      version: "1.0.0",
      description: `Powerful AI-driven service for generating high-quality videos and images from text descriptions.

Key Features:
- Text-to-video generation (e.g., \`/luma/videos/generate\`)
- Text-to-image generation (e.g., \`/luma/images/generate\`)
- Multiple video durations (\`5s\` or \`9s\`)
- Various resolutions (\`540p\` to \`4K\`)
- Aspect ratio control
- Keyframe-based video generation
- Negative prompting for better control
- Asynchronous progress tracking via status endpoints (e.g., \`/luma/videos/status/{id}\`)

Getting Started:
1. Obtain a Luma API key from your dashboard
2. Choose the appropriate endpoint for video or image generation
3. Follow the asynchronous workflow:
   - Submit generation request with \`apiKey\` and parameters
   - Poll the corresponding status endpoint using the returned \`id\`
   - Retrieve the final asset URL (\`video\` or \`image\`) upon completion

For detailed API documentation and examples, visit: https://docs.lumalabs.ai`,
    },
    externalDocs: {
      description: "Luma AI Documentation",
      url: "https://docs.lumalabs.ai",
    },
    paths: {
      // NOTE: Paths MUST include the service name prefix ('/luma') as per ROUTE_STANDARDS.md
      "/luma/videos/generate": {
        post: {
          summary: "Generate a video using Luma AI",
          description: `Initiates an asynchronous video generation task based on your text prompt and parameters.

Workflow:
1. Submit Generation Request
   - Provide text \`prompt\` and parameters (e.g., \`duration\`, \`resolution\`)
   - Include your \`apiKey\` in the body

2. Handle Response
   - Receive a generation \`id\`
   - Status starts as \`queued\` or \`submitted\`

3. Monitor Progress
   - Poll the status endpoint (\`/luma/videos/status/{id}\`)
   - Check the \`state\` field for progress
   - Final states are \`completed\` or \`failed\`

4. Retrieve Results
   - Once completed, get video URL from \`assets.video\`
   - Thumbnail available in \`assets.image\`
   - Progress preview in \`assets.progress_video\`

Generation States:
- \`queued\`: Task is in queue
- \`submitted\`: Task accepted by system
- \`processing\`: Active generation
- \`dreaming\`: Advanced processing stage
- \`completed\`: Generation successful
- \`failed\`: Error occurred (see \`failure_reason\`)

Tips:
- Use detailed, clear prompts for best results
- Include \`negativePrompt\` to avoid unwanted elements
- Consider using \`keyframes\` for more control
- Monitor rate limits in response headers`,
          tags: LUMA_TAGS,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: CreateVideoGenerationRequestSchema,
              },
            },
          },
          responses: {
            [HTTP_STATUS.OK]: {
              description: "Video generation task successfully initiated",
              content: {
                "application/json": {
                  schema: VideoGenerationResponseSchema,
                },
              },
            },
            [HTTP_STATUS.BAD_REQUEST]: {
              description: `Request validation failed. Common causes:
- Missing or invalid API key
- Empty or invalid prompt
- Invalid parameter values
- Unsupported resolution/duration`,
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.UNAUTHORIZED]: {
              description: "Authentication failed - invalid or expired API key",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.UNPROCESSABLE_ENTITY]: {
              description: `Valid request but generation cannot be processed. Common causes:
- Rate limit exceeded
- Account restrictions
- Content policy violation
- Resource limitations`,
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
              description: "Server error while processing the request",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.SERVICE_UNAVAILABLE]: {
              description: "Luma AI service is temporarily unavailable",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/luma/videos/status/{id}": {
        post: {
          summary: "Check video generation status",
          description: `Retrieves the current status and results of a video generation task.

Workflow:
1. Submit Status Request
   - Provide generation ID in URL
   - Include API key in body
   - Response includes current state

2. Interpret Results
   - Check 'state' field for progress
   - If completed, use assets.video URL
   - If failed, check failure_reason

3. Handle Different States
   - Continue polling if in progress
   - Stop polling on completed/failed
   - Adjust polling frequency as needed

Polling Strategy:
- Start with 5-second intervals
- Increase interval on longer tasks
- Implement exponential backoff
- Respect rate limits

Tips:
- Check response headers for rate limits
- Handle all possible states
- Implement timeout for long-running tasks
- Cache successful results`,
          tags: LUMA_TAGS,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Video generation task ID",
              schema: {
                type: "string",
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: GetVideoGenerationBodySchema,
              },
            },
          },
          responses: {
            [HTTP_STATUS.OK]: {
              description: "Successfully retrieved generation status",
              content: {
                "application/json": {
                  schema: VideoGenerationResponseSchema,
                },
              },
            },
            [HTTP_STATUS.BAD_REQUEST]: {
              description: "Invalid generation ID format",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.UNAUTHORIZED]: {
              description: "Invalid or missing API key",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.NOT_FOUND]: {
              description: "Generation task not found",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
              description: "Server error while checking status",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/luma/images/generate": {
        post: {
          summary: "Generate an Image with Luma AI", // Consistent naming
          description: `Initiates an asynchronous Luma AI task to generate an image based on the provided parameters.

**Full Path:** **/nodes/luma/images/generate**

**AUTHENTICATION:** Requires \`apiKey\` in the request body.

**WORKFLOW:**
1. Submit request with parameters (prompt, apiKey, etc.).
2. Receive generation \`id\` (\`data.id\`).
3. Poll **/nodes/luma/images/status/{id}** until \`state\` is \`completed\` or \`failed\`.
4. If \`completed\`, the image URL is in \`data.assets.image\`.

**POSSIBLE STATES:** See the **/nodes/luma/videos/generate** description for the list of states.

**POLLING STRATEGY:** Recommended interval: 2-5 seconds. Stop polling once \`completed\` or \`failed\`.`,
          tags: LUMA_TAGS,
          requestBody: {
            required: true,
            description:
              "Image generation parameters including prompt, aspect ratio, model, and API key.",
            content: {
              "application/json": {
                schema: CreateImageGenerationRequestSchema, // Use imported schema
              },
            },
          },
          responses: {
            "200": {
              description: "Image generation task successfully initiated.",
              content: {
                "application/json": {
                  schema: ImageGenerationResponseSchema, // Use derived response schema
                },
              },
            },
            "500": {
              description: "Internal Server Error or Luma Service Error",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/luma/images/status/{id}": {
        post: {
          // Changed from get in original schema to post to align with implementation
          summary: "Get Luma AI Image Generation Status",
          description: `Retrieves the status and results (if available) of a specific Luma AI image generation task.

**Full Path:** **/nodes/luma/images/status/{id}**

**WORKFLOW:**
1. Submit the generation \`id\` in the URL path.
2. Provide the \`apiKey\` in the request body.
3. Poll this endpoint until \`state\` is \`completed\` or \`failed\`.
4. Results (image URL) are populated in the \`data.assets.image\` field upon completion.

**POSSIBLE STATES:** See the **/nodes/luma/videos/generate** description for the list of states.`,
          tags: LUMA_TAGS,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Unique identifier of the image generation task.",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            // Status check requires POST body for apiKey
            required: true,
            description: "Authentication parameters required.",
            content: {
              "application/json": {
                schema: GetImageGenerationBodySchema, // Use imported schema
              },
            },
          },
          responses: {
            "200": {
              description: "Current image generation task status.",
              content: {
                "application/json": {
                  schema: ImageGenerationResponseSchema, // Use derived response schema
                },
              },
            },
            "500": {
              description: "Error retrieving task status.",
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

  // Add custom metadata as per ROUTE_STANDARDS.md
  return {
    ...document,
    meta: {
      tags: ["video", "image", "ai", "generation", "luma"],
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/luma-logo.png",
      sourceUrl: "https://lumalabs.ai",
      description: `Luma AI is a cutting-edge platform that transforms text descriptions into high-quality videos.

Key Features:
- Advanced text-to-video generation
- Multiple resolution options (up to 4K)
- Customizable video duration
- Keyframe-based generation
- Progress tracking
- Negative prompting
- High-quality output

Use Cases:
- Marketing videos
- Product demonstrations
- Creative content
- Educational material
- Social media content
- Artistic projects`,
      provider: "Luma AI",
      category: "AI/ML",
      features: [
        "Text-to-video generation",
        "Multiple resolutions (540p to 4K)",
        "Customizable duration",
        "Aspect ratio control",
        "Negative prompting",
        "Progress tracking",
        "Keyframe support",
        "High-quality output",
      ],
      pricing: "Usage-based pricing with various tiers available",
      documentation: "https://docs.lumalabs.ai",
      support: "https://help.lumalabs.ai",
    },
  };
};
