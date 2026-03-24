import { createDocument, ZodOpenApiObject } from "zod-openapi";
import { ApiErrorResponseSchema } from "../../../types/api-response";
import {
  CreatePredictionRequestSchema,
  CreatePredictionResponseSchema,
  GetPredictionStatusRequestSchema,
  GetPredictionStatusResponseSchema,
} from "./schemas/predictionSchemas";

// Add content to common descriptions
const commonWorkflowDescription = `\nWORKFLOW (Asynchronous):\n1. Submit a POST request to \`/create\` with your API key, the model \`version\` ID, and the model-specific \`input\` object.\n2. Receive a \`taskId\` (Replicate prediction ID) in the successful response (200 OK).\n3. Periodically poll the \`/status\` endpoint using your API key and the received \`taskId\`.\n4. Continue polling until the \`status\` field in the response becomes \"succeed\" or \"failed\".\n5. If \"succeed\", the model's output is available in the \`output\` field (structure depends on the model).\n6. If \"failed\", check the \`error\` field for details.\n`;

const commonAuthenticationDescription = `\nAUTHENTICATION:\n- Requires a Replicate API Token passed in the \`apiKey\` field of the request body.\n- Obtain tokens from your [Replicate Account Settings](https://replicate.com/account/api-tokens).\n`;

const commonErrorHandlingDescription = `\nERROR HANDLING:\n- **Task Creation:** Errors during task submission (validation, auth, invalid version ID, Replicate API errors) result in a 500 response with details.\n- **Task Status:** The \`/status\` endpoint returns the task state. If the task failed during processing on Replicate's side, the status will be \"failed\", and \`error\` will contain details. If querying the status itself fails (e.g., invalid taskId or auth error), the endpoint returns a 500 response.\n`;

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Replicate API Integration",
      version: "1.0.0",
      description:
        "Generalized API endpoints for running models and checking prediction status on Replicate.",
    },
    paths: {
      "/replicate/predictions/create": {
        post: {
          summary: "Create Replicate Prediction Task",
          description: `Starts an asynchronous prediction task on Replicate for a specified model version.\n\nNOTE: All endpoints are automatically prefixed with /nodes. The full path is /nodes/replicate/predictions/create\n\n**IMPORTANT:** You MUST provide the correct Replicate model version ID and the corresponding input object structure required by that specific model version. Refer to the model's documentation on Replicate.\n${commonAuthenticationDescription}${commonWorkflowDescription}${commonErrorHandlingDescription}\nBEST PRACTICES:\n- Use the exact model version ID from Replicate.\n- Verify the expected input schema for that version.\n- Consider using the optional \`webhook\` parameter for efficient status updates instead of polling.`,
          tags: ["Replicate"],
          requestBody: {
            content: {
              "application/json": {
                schema: CreatePredictionRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Prediction task creation initiated successfully. Returns the task ID.",
              content: {
                "application/json": {
                  schema: CreatePredictionResponseSchema,
                },
              },
            },
            "500": {
              description: "Error creating prediction task.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/replicate/predictions/status": {
        post: {
          summary: "Get Replicate Prediction Status",
          description: `Checks the status of a previously created Replicate prediction task.\n\nNOTE: All endpoints are automatically prefixed with /nodes. The full path is /nodes/replicate/predictions/status\n\n**IMPORTANT:** The structure of the \`output\` field in the response depends entirely on the specific Replicate model version used. You must refer to the model's documentation on Replicate to understand how to interpret the results.\n${commonAuthenticationDescription}${commonErrorHandlingDescription}\nWORKFLOW:\n- Poll this endpoint with the \`taskId\` obtained from the \`/create\` request.\n- Check the \`status\` field in the response (\"submitted\", \"processing\", \"succeed\", \"failed\").\n- If status is \"succeed\", check the \`output\` field for results.\n- If status is \"failed\", check the \`error\` field for details.`,
          tags: ["Replicate"],
          requestBody: {
            content: {
              "application/json": {
                schema: GetPredictionStatusRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Returns the current status and results (if available) of the prediction task.",
              content: {
                "application/json": {
                  schema: GetPredictionStatusResponseSchema,
                },
              },
            },
            "500": {
              description:
                "Error querying prediction status (e.g., invalid task ID or internal error).",
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
      tags: ["AI/ML", "Inference", "General"],
      provider: "Replicate",
      category: "AI/ML Inference",
      imageUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAARVBMVEX///8AAAC9vb0dHR3k5OTx8fH4+PiJiYlqamqXl5fIyMhhYWFkZGRcXFyRkZHBwcEQEBBxcXHX19fQ0NDr6+usrKy2trZiVQnLAAABkElEQVR4nO3bzU7DMBCFUQoFCk0LlJ/3f1S2M1G6wE0HuzpnfeXk21ry3R0AAAAAwOXeNg9jeP9oLLzfjGKnUGH3FCrsn0KF/VOosH8KFfZPocL+3X7hfuXC02N3Vi7cNp7XH4XjUzg+heNTOD6F41M4PoXjUzi+PxU+/auKwjPbGoebL1z7rk1hPYUK5xTWU6hwTmE9hQrnFNZTqHBOYT2F1yx8bvx2DYWJwi4pTBR2SWGisEsKE4VdUpgo7JLCRGG0fV3ZqbfC45lxs7XfPV1c+LJ2YXc3UQoVKlSoUKFChQoVKlSoUKHCJtMohdO+zeE4SmHjf7ZTmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJZRmCiMFJb53O+WHL6WxovT3fS9tP2Zlg++bg4AAABn/QKdzFzwbmJ+XAAAAABJRU5ErkJggg==", // Replicate logo URL
      sourceUrl: "https://replicate.com/docs/reference/http", // Link to Replicate docs
      async: true, // Uses async polling pattern
      complexity: "high", // Requires user to know model-specific inputs/outputs
    },
  } as ZodOpenApiObject; // Add cast here to ensure correct type
};
