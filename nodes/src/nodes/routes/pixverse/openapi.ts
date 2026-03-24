import { createDocument, ZodOpenApiObject } from "zod-openapi";
import { ApiErrorResponseSchema } from "../../../types/api-response";
import {
  CreateImageToVideoRequestSchema,
  CreateTextToVideoRequestSchema,
  CreateTransitionRequestSchema,
  CreateVideoResponseSchema,
  QueryTaskRequestSchema,
  QueryTaskResponseSchema,
  UploadImageResponseSchema,
} from "./schemas";

// Common descriptions based on PixVerse docs and our standards
const commonWorkflowDescription = `\nWORKFLOW (Asynchronous):\n1. For Image-to-Video or Transitions, first upload image(s) using POST /pixverse/image/upload to get img_id(s).\n2. Submit a POST request to the desired create endpoint (/video/text/create, /video/image/create, /video/transition/create).\n3. Receive a \`videoId\` in the successful response (200 OK, wrapped in standard success format).\n4. Periodically poll the \`/pixverse/video/status\` endpoint (POST) with the \`videoId\` in the request body.\n5. Continue polling until the \`status\` field in the response becomes \"succeed\", \"moderation_failed\", or \"failed\". Recommended polling interval: every 5+ seconds when status is \"processing\".\n6. If status is \"succeed\", the generated video URL is available in the \`url\` field.\n7. If status is \"failed\" or \"moderation_failed\", the task did not complete successfully. Credits for moderation failures (status 7 from PixVerse) should be refunded automatically by PixVerse.`;

const commonAuthenticationDescription = `\nAUTHENTICATION:\n- Requires a PixVerse API Key passed in the \`apiKey\` field of the request body (for JSON requests) or form data (for image upload).\n- Obtain API Key from the PixVerse platform website (API Key section).\n- The service layer handles sending this as the required \`API-KEY\` header and generating the unique \`AI-trace-ID\` header for each PixVerse request.`;

const commonErrorHandlingDescription = `\nERROR HANDLING:\n- **Image Upload:** Errors during upload (file format, size, auth, API errors) result in a 500 response from this node.\n- **Task Creation:** Errors during task submission (validation, auth, PixVerse API errors like rate limits [500044], bad parameters [400013, 400017], invalid img_id) result in a 500 response from this node.\n- **Task Status:** Querying \`/pixverse/video/status\`. If the query itself fails (e.g., invalid videoId format, auth issue), this node returns 500. If the query is successful but the PixVerse task failed or was moderated, the response will have status \"failed\" or \"moderation_failed\". PixVerse status codes: 1=succeed, 5=processing, 7=moderation_failed, 8=failed.`;

export const createOpenApiDocument = (): ZodOpenApiObject => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "PixVerse Video Generation Integration",
      version: "1.0.0",
      description:
        "API endpoints for generating videos using the PixVerse platform API (Text-to-Video, Image-to-Video, Transitions). Includes image upload.",
    },
    paths: {
      "/pixverse/image/upload": {
        post: {
          summary: "Upload Image for PixVerse Video Generation",
          description: `Uploads an image file (JPG, PNG, WebP) to PixVerse for use in Image-to-Video or Transition tasks. Returns an image ID.\\n\\nNOTE: Full path is /nodes/pixverse/image/upload\\n${commonAuthenticationDescription}\\n- Request MUST be sent as **multipart/form-data**. Include the API Key in a field named \`apiKey\` and the image file in a field named \`img\`.\\n${commonErrorHandlingDescription}\\nLIMITATIONS:\\n- Image size < 4000x4000 pixels and < 20MB.`, // Reference: https://docs.platform.pixverse.ai/how-to-use-image-to-video-882971m0
          tags: ["PixVerse"],
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    apiKey: {
                      // Define apiKey as part of the form data
                      type: "string",
                      description:
                        "Your PixVerse API Key (required in form data).",
                    },
                    img: {
                      // Define the image file field
                      type: "string",
                      format: "binary",
                      description: "The image file (JPG, PNG, WebP).",
                    },
                  },
                  required: ["apiKey", "img"], // Both are required
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Image uploaded successfully. Returns the PixVerse image ID.",
              content: {
                "application/json": {
                  schema: UploadImageResponseSchema,
                },
              },
            },
            "400": {
              // Specific error for missing file or bad body structure
              description: "Bad Request (e.g., missing image file in form).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "500": {
              description: "Error uploading image to PixVerse.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/pixverse/video/text/create": {
        post: {
          summary: "Create PixVerse Text-to-Video Generation Task",
          description: `Initiates an asynchronous task to generate a video from a text prompt using PixVerse.\\n\\nNOTE: All endpoints are automatically prefixed with /nodes. The full path is /nodes/pixverse/video/text/create\\n${commonAuthenticationDescription}${commonWorkflowDescription}${commonErrorHandlingDescription}\\nBEST PRACTICES:\\n- Craft detailed prompts (25-200 words recommended by PixVerse).\n- Be mindful of parameter restrictions (e.g., 1080p limitations).\\n- Adhere to PixVerse rate limits (see PixVerse documentation).`, // Reference: https://docs.platform.pixverse.ai/how-to-use-text-to-video-882970m0
          tags: ["PixVerse"],
          requestBody: {
            content: {
              "application/json": {
                schema: CreateTextToVideoRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Task creation accepted successfully. Returns the PixVerse video ID.",
              content: {
                "application/json": {
                  schema: CreateVideoResponseSchema,
                },
              },
            },
            "500": {
              description: "Error creating PixVerse task.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/pixverse/video/image/create": {
        post: {
          summary: "Create PixVerse Image-to-Video Generation Task",
          description: `Initiates an asynchronous task to generate a video from a previously uploaded image using PixVerse.\\n\\nNOTE: Full path is /nodes/pixverse/video/image/create\\n${commonAuthenticationDescription}${commonWorkflowDescription}${commonErrorHandlingDescription}\\nREQUIREMENTS:\\n- Upload the image first via POST /pixverse/image/upload to get the \`img_id\`.\\n- Provide the \`img_id\` in the request body.`, // Reference: https://docs.platform.pixverse.ai/how-to-use-image-to-video-882971m0
          tags: ["PixVerse"],
          requestBody: {
            content: {
              "application/json": {
                schema: CreateImageToVideoRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Task creation accepted successfully. Returns the PixVerse video ID.",
              content: {
                "application/json": {
                  schema: CreateVideoResponseSchema,
                },
              },
            },
            "500": {
              description: "Error creating PixVerse task.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/pixverse/video/transition/create": {
        post: {
          summary: "Create PixVerse Video Transition Task (First/Last Frame)",
          description: `Initiates an asynchronous task to generate a video that transitions between two previously uploaded images using PixVerse.\\n\\nNOTE: Full path is /nodes/pixverse/video/transition/create\\n${commonAuthenticationDescription}${commonWorkflowDescription}${commonErrorHandlingDescription}\\nREQUIREMENTS:\\n- Upload BOTH images first via POST /pixverse/image/upload to get their \`img_id\`s.\\n- Provide \`first_frame_img\` and \`last_frame_img\` IDs in the request body.`, // Reference: https://docs.platform.pixverse.ai/how-to-use-transitionfirst-last-frame-feature-882973m0
          tags: ["PixVerse"],
          requestBody: {
            content: {
              "application/json": {
                schema: CreateTransitionRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Task creation accepted successfully. Returns the PixVerse video ID.",
              content: {
                "application/json": {
                  schema: CreateVideoResponseSchema,
                },
              },
            },
            "500": {
              description: "Error creating PixVerse task.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/pixverse/video/status": {
        post: {
          summary: "Query PixVerse Video Generation Task Status",
          description: `Checks the status of any previously created PixVerse video generation task (Text, Image, Transition).\\n\\nNOTE: Full path is /nodes/pixverse/video/status\\n${commonAuthenticationDescription}${commonErrorHandlingDescription}\\nWORKFLOW:\\n- Poll this endpoint with the \`videoId\`.\\n- Check the \`status\`.`,
          tags: ["PixVerse"],
          requestBody: {
            content: {
              "application/json": {
                schema: QueryTaskRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Returns the current status and result (if available) of the task.",
              content: {
                "application/json": {
                  schema: QueryTaskResponseSchema,
                },
              },
            },
            "500": {
              description: "Error querying task status.",
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
      tags: ["Video", "AI", "Text-to-Video", "Image-to-Video"],
      provider: "PixVerse",
      category: "Video Generation",
      imageUrl:
        "data:image/jpeg;base64,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",
      sourceUrl: "https://docs.platform.pixverse.ai/",
      async: true,
      complexity: "high", // Increased complexity due to multiple paths & upload
    },
  } as ZodOpenApiObject;
};
