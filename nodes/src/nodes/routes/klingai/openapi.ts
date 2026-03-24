import { createDocument, ZodOpenApiObject } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  GenerateImageRequestSchema,
  GenerateImageResponseSchema,
  QueryImageTaskResponseSchema,
} from "./schemas/imageSchemas";
import { QueryTaskRequestSchema } from "./schemas/sharedSchemas";
import {
  GenerateVideoExtensionRequestSchema,
  GenerateVideoExtensionResponseSchema,
  GenerateVideoFromImageRequestSchema,
  GenerateVideoFromImageResponseSchema,
  GenerateVideoFromTextRequestSchema,
  GenerateVideoFromTextResponseSchema,
  QueryVideoTaskResponseSchema,
} from "./schemas/videoSchemas";

// Common Descriptions
const commonAuth = `
**Authentication:** Requires Kling AI \`accessKey\` and \`secretKey\` in the request body.`;
const commonAsyncWorkflow = `
**Workflow (Asynchronous):**
1. Submit a \`POST\` request to a \`generate\` endpoint.
2. Receive a \`taskId\` in the \`200 OK\` response.
3. Periodically poll the corresponding \`query\` endpoint using the \`taskId\`.
4. Continue polling until \`task_status\` is \`succeed\` or \`failed\`.
5. If \`succeed\`, the \`task_result\` contains the output URL(s).
6. If \`failed\`, check \`task_status_msg\` for details.`;
const commonErrorHandling = `
**Error Handling:**
- Task Creation: Errors during submission (validation, auth, API errors) return non-200 status (e.g., \`400\`, \`401\`, \`422\`, \`500\`).
- Task Status Query: Returns task state (\`succeed\`/\`failed\`/\`processing\`/\`submitted\`). If querying fails (invalid \`taskId\`), returns non-200 status.`;

// Common Tags
const KLINGAI_TAGS = ["Kling AI"];

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Kling AI Video & Image Generation API",
      version: "1.0.0",
      description: `API for generating high-quality videos and images using the Kling AI service from KuaiShou Technology.
Supports text-to-video, image-to-video, video extension, and text-to-image generation.
${commonAuth}${commonAsyncWorkflow}`, // Combined description
    },
    externalDocs: {
      description: "Kling AI Official Website (Chinese)",
      url: "https://kling.kuaishou.com/", // Link to official site
    },
    paths: {
      // === Video Endpoints ===
      "/klingai/video/text-to-video": {
        post: {
          summary: "Generate Video from Text",
          description: `Initiates an asynchronous task to generate a video based on a text prompt.
${commonErrorHandling}`, // Added common error handling
          tags: KLINGAI_TAGS,
          requestBody: {
            required: true,
            description: "Credentials and text prompt for video generation",
            content: {
              "application/json": {
                schema: GenerateVideoFromTextRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Task successfully submitted. Returns `taskId`.",
              content: {
                "application/json": {
                  schema: GenerateVideoFromTextResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., prompt too long).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed (invalid keys).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Request valid but rejected by Kling (e.g., content policy, limits).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Internal server error or Kling API issue.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
      "/klingai/video/image-to-video": {
        post: {
          summary: "Generate Video from Image",
          description: `Initiates an asynchronous task to generate a video from a source image, with optional motion controls (masks, camera movement, end frame).
${commonErrorHandling}
**Note:** Certain features like \`image_tail\` and masks have restrictions on duration and compatibility with other controls (see schema refines).`,
          tags: KLINGAI_TAGS,
          requestBody: {
            required: true,
            description:
              "Credentials, source image, and optional motion controls",
            content: {
              "application/json": {
                schema: GenerateVideoFromImageRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Task successfully submitted. Returns `taskId`.",
              content: {
                "application/json": {
                  schema: GenerateVideoFromImageResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., invalid image format/size, conflicting controls).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Request valid but rejected (e.g., content policy, limits).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Internal server error or Kling API issue.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
      "/klingai/video/extension": {
        post: {
          summary: "Extend Existing Video",
          description: `Initiates an asynchronous task to extend a previously generated Kling AI video based on a new prompt.
${commonErrorHandling}
**Requires:** The \`id\` of a video generated in a previous \`succeed\`ed task (found within the \`task_result.videos\` array).`,
          tags: KLINGAI_TAGS,
          requestBody: {
            required: true,
            description: "Credentials, original video ID, and extension prompt",
            content: {
              "application/json": {
                schema: GenerateVideoExtensionRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Task successfully submitted. Returns `taskId`.",
              content: {
                "application/json": {
                  schema: GenerateVideoExtensionResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., missing video ID).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description: "Original video specified by `video_id` not found.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Request valid but rejected (e.g., content policy, limits).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Internal server error or Kling API issue.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
      "/klingai/video/query": {
        post: {
          summary: "Query Video Task Status",
          description: `Checks the status and results of any previously submitted Kling AI video generation task (text-to-video, image-to-video, extension).
${commonErrorHandling}`,
          tags: KLINGAI_TAGS,
          requestBody: {
            required: true,
            description:
              "Credentials and the `taskId` of the video task to query",
            content: { "application/json": { schema: QueryTaskRequestSchema } }, // Uses generic query request
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Returns current task status. If `succeed`, includes video result details.",
              content: {
                "application/json": { schema: QueryVideoTaskResponseSchema },
              }, // Uses specific video query response union
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description: "Invalid request body (e.g., missing taskId).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description: "Task with the specified `taskId` not found.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Internal server error querying status.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
      // === Image Endpoints ===
      "/klingai/image/generate": {
        post: {
          summary: "Generate Image from Text or Image",
          description: `Initiates an asynchronous task to generate image(s) based on a text prompt, optionally using a reference image.
${commonErrorHandling}
**Modes:**
- **Text-to-Image:** Provide \`prompt\`, optionally \`negative_prompt\`.
- **Image-to-Image:** Provide \`prompt\` and \`image\`. Cannot use \`negative_prompt\`. Model \`kling-v1-5\` requires \`image_reference\`.`,
          tags: KLINGAI_TAGS,
          requestBody: {
            required: true,
            description: "Credentials and parameters for image generation",
            content: {
              "application/json": { schema: GenerateImageRequestSchema },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Task successfully submitted. Returns `taskId`.",
              content: {
                "application/json": { schema: GenerateImageResponseSchema },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., prompt too long, conflicting options).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Request valid but rejected (e.g., content policy, limits).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Internal server error or Kling API issue.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
      "/klingai/image/query": {
        post: {
          summary: "Query Image Task Status",
          description: `Checks the status and results of a previously submitted Kling AI image generation task.
${commonErrorHandling}`,
          tags: KLINGAI_TAGS,
          requestBody: {
            required: true,
            description:
              "Credentials and the `taskId` of the image task to query",
            content: { "application/json": { schema: QueryTaskRequestSchema } }, // Uses generic query request
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Returns current task status. If `succeed`, includes image result details.",
              content: {
                "application/json": { schema: QueryImageTaskResponseSchema },
              }, // Uses specific image query response union
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description: "Invalid request body (e.g., missing taskId).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description: "Task with the specified `taskId` not found.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Internal server error querying status.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
    },
  });

  // Add custom metadata
  return {
    ...document,
    meta: {
      tags: ["ai", "video", "image", "generation", "kling", "kuaishou"],
      provider: "Kling AI (KuaiShou)",
      category: "AI/ML",
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/klingai-logo.png", // Official Logo URL
      sourceUrl: "https://kling.kuaishou.com/",
      description: `Kling AI, developed by KuaiShou Technology, is a powerful text-to-video and image generation model capable of producing high-resolution, long-duration videos with complex motion and realistic physics.

Key Capabilities:
- **Text-to-Video:** Generate videos up to 2 minutes long at 1080p/30fps from text prompts.
- **Image-to-Video:** Animate static images with optional motion controls.
- **Video Extension:** Extend existing videos based on new prompts.
- **Text-to-Image / Image-to-Image:** Generate high-quality images.
- Simulates real-world physics and complex spatio-temporal movements.`,
      features: [
        "Text-to-Video (up to 2 min, 1080p)",
        "Image-to-Video with motion control (Masks/Camera)",
        "Video Extension based on prompts",
        "Text-to-Image Generation (Multiple models)",
        "Image-to-Image Generation (Subject/Face reference)",
        "Variable Aspect Ratios & Durations",
        "Asynchronous Task Processing",
        "Optional Callback URLs",
      ],
      pricing:
        "Typically accessed via API keys, pricing/limits defined by KuaiShou.", // General pricing info
      documentation:
        "https://kling.kuaishou.com/ (Official site, API docs may require login/access)",
      support: "Via KuaiShou/Kling official channels", // General support info
    },
  } as ZodOpenApiObject;
};
