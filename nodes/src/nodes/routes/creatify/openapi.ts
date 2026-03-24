import { createDocument, ZodOpenApiObject } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  CreateLipsyncResponseSchema,
  CreateMultiLipsyncRequestSchema,
  CreateSingleLipsyncRequestSchema,
  QueryTaskRequestSchema,
  QueryTaskResponseSchema,
} from "./schemas/creatifySchemas";

// Common Descriptions
const commonWorkflowDescription = `\n**Workflow (Asynchronous):**\n1. Submit a \`POST\` request to \`/create\` or \`/multi-avatar/create\`.\n2. Receive a \`taskId\` in the successful (\`200 OK\`) response.\n3. Periodically poll the \`/status\` endpoint using the received \`taskId\`.\n4. Continue polling until \`status\` is \`succeed\` or \`failed\`.\n5. If \`succeed\`, the \`resultUrl\` contains the video link.\n6. If \`failed\`, check \`statusMessage\` for error details.`;

const commonAuthenticationDescription = `\n**Authentication:**\n- Requires Creatify \`apiId\` (X-API-ID) and \`apiKey\` (X-API-KEY) in the request body.\n- Obtain credentials from your Creatify account settings.`;

const commonErrorHandlingDescription = `\n**Error Handling:**\n- Task Creation: Errors during submission (validation, auth, Creatify API errors) result in a non-200 response (e.g., \`400\`, \`401\`, \`422\`, \`500\`) with details in the standard error format.\n- Task Status: The \`/status\` endpoint returns the task state. If the task failed *during* processing by Creatify, the \`status\` will be \`failed\`, and \`statusMessage\` will contain the reason. If querying the status endpoint *itself* fails (e.g., invalid \`taskId\`), it returns a non-200 error (e.g., \`400\`, \`404\`, \`500\`).`;

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Creatify AI UGC Avatar Video API",
      version: "1.0.0",
      description: `API for generating User-Generated Content (UGC) style avatar videos using the Creatify.ai service.\nSupports single-avatar and multi-avatar scene generation.\n${commonAuthenticationDescription}${commonWorkflowDescription}`,
    },
    externalDocs: {
      description: "Creatify API Documentation",
      url: "https://docs.creatify.ai/docs/api-reference/introduction",
    },
    paths: {
      "/creatify/create": {
        post: {
          summary: "Create Single Avatar Lipsync Video",
          description: `Initiates an asynchronous Creatify task to generate a UGC avatar video with one avatar.\n\n**Input:** Can use text-to-speech (provide \`text\` and \`voice_id\`) or sync to an existing audio file (provide \`audio_url\`).\n${commonErrorHandlingDescription}\n**Best Practices:**\n- Ensure \`avatar_id\` and \`voice_id\` are valid.\n- Use \`callback_url\` for efficient status updates.`,
          tags: ["Creatify"],
          requestBody: {
            required: true,
            description: "Parameters for single avatar video generation",
            content: {
              "application/json": {
                schema: CreateSingleLipsyncRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Task creation accepted. Returns the assigned `taskId`.",
              content: {
                "application/json": {
                  schema: CreateLipsyncResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request body or parameters (e.g., missing text/audio, invalid URL, missing voice_id for text).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid `apiId` or `apiKey`.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Request valid, but Creatify rejected it (e.g., invalid avatar/voice ID, content policy violation, limits exceeded).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or error communicating with Creatify API.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/creatify/multi-avatar/create": {
        post: {
          summary: "Create Multi-Avatar Lipsync Video (v2)",
          description: `Initiates an asynchronous Creatify task to generate a video with multiple sequenced avatar scenes using Creatify\'s v2 Lipsync API.\n\n**Input:** Define each scene in the \`video_inputs\` array, specifying \`character\`, \`voice\`, and \`background\` for each.\n${commonErrorHandlingDescription}\n**Requirements:**\n- Each item in \`video_inputs\` must include a valid \`background\` object.\n**Best Practices:**\n- Carefully structure the \`video_inputs\` array for desired sequence.\n- Ensure all \`avatar_id\`, \`voice_id\` values are valid.\n- Use \`callback_url\` for status updates.\n- Refer to Creatify v2 docs for advanced options.`,
          tags: ["Creatify"],
          requestBody: {
            required: true,
            description: "Parameters for multi-avatar video generation",
            content: {
              "application/json": {
                schema: CreateMultiLipsyncRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Task creation accepted. Returns the assigned `taskId`.",
              content: {
                "application/json": {
                  schema: CreateLipsyncResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request body or parameters (e.g., malformed video_inputs array, missing required fields within a scene).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid `apiId` or `apiKey`.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Request valid, but Creatify rejected it (e.g., invalid IDs, content policy, limits exceeded).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or error communicating with Creatify API.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/creatify/status": {
        post: {
          summary: "Query Creatify Task Status",
          description: `Checks the status of a previously created Creatify UGC avatar video task.\n\n**Workflow:**\n- Poll this endpoint with the \`taskId\` obtained from a create request.\n- Provide \`apiId\` and \`apiKey\` in the body.\n- Check the \`status\` field: \`submitted\`, \`processing\`, \`succeed\`, \`failed\`.\n- If \`succeed\`, the \`resultUrl\` field contains the video link.\n- If \`failed\`, check \`statusMessage\` for details.${commonErrorHandlingDescription}`,
          tags: ["Creatify"],
          requestBody: {
            required: true,
            description: "Credentials and the taskId to query",
            content: {
              "application/json": {
                schema: QueryTaskRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Returns the current task status and result (if available).",
              content: {
                "application/json": {
                  schema: QueryTaskResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request body (e.g., missing taskId or credentials).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid `apiId` or `apiKey`.",
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
              description: "Internal server error querying task status.",
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

  // Add metadata and return correctly typed document
  return {
    ...document,
    meta: {
      tags: ["ai", "video", "avatar", "ugc", "lipsync", "creatify"],
      provider: "Creatify.ai",
      category: "Video Generation",
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/creatify-logo.jpeg", // Official Logo URL
      sourceUrl: "https://creatify.ai/",
      description: `Creatify is an AI platform specializing in generating engaging UGC-style avatar videos from text or audio inputs. It supports single and multi-avatar scenes.\n\nKey Features:\n- Single & Multi-Avatar Video Generation\n- Text-to-Speech with Various Voices\n- Lip-syncing to Existing Audio Files\n- Customizable Backgrounds (Image/Video)\n- Selectable Aspect Ratios (1x1, 16x9, 9x16)\n- Caption Styling Options\n- Asynchronous Task Processing with Status Polling/Webhooks\n\nUse Cases:\n- Creating social media video ads.\n- Generating personalized marketing messages.\n- Producing training and explainer videos.\n- Enhancing content with dynamic avatars.`,
      features: [
        "Single Avatar Lipsync (Text/Audio input)",
        "Multi-Avatar Sequenced Videos (v2 API)",
        "Text-to-Speech Voice Options",
        "Audio File Lip-syncing",
        "Image/Video Backgrounds",
        "Multiple Aspect Ratios (1x1, 16x9, 9x16)",
        "Caption Styles",
        "Asynchronous Task Handling",
        "Optional Callback URLs",
      ],
      pricing: "Subscription-based with different tiers and API credits.",
      documentation: "https://docs.creatify.ai/docs/api-reference/introduction",
      support: "Via Creatify website/dashboard", // General support info
    },
  } as ZodOpenApiObject;
};
