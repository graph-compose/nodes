import { createDocument, ZodOpenApiObject } from "zod-openapi";
import { ApiErrorResponseSchema } from "../../../types/api-response";
import {
  CreateCallRequestSchema,
  CreateCallResponseSchema,
} from "./schemas/callSchemas";

// Common descriptions
const commonAuthenticationDescription = `\nAUTHENTICATION:\n- Requires a Vapi API Key passed in the \`apiKey\` field of the request body.\n- Obtain API Key from the Vapi Dashboard (https://dashboard.vapi.ai/).\n- The service layer handles sending this as the required \`Authorization: Bearer <token>\` header.`;

const commonErrorHandlingDescription = `\nERROR HANDLING:\n- Errors during request validation, Vapi API interaction (e.g., invalid API key, bad parameters, insufficient credits), or response validation result in a 500 response from this node with details. Check the underlying error message for Vapi specifics.`;

export const createOpenApiDocument = (): ZodOpenApiObject => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Vapi AI Voice Calling Integration",
      version: "1.0.0",
      description:
        "API endpoint for initiating outbound AI voice calls using the Vapi platform.",
    },
    paths: {
      "/vapi/call/create": {
        post: {
          summary: "Create Outbound AI Voice Call with Vapi",
          description: `Initiates an outbound AI voice call via the Vapi API.\\n\\nNOTE: All endpoints are automatically prefixed with /nodes. The full path is /nodes/vapi/call/create\\n${commonAuthenticationDescription}\\nCONFIGURATION:\\n- Provide customer number, Twilio details, and base assistant configuration.\\n- Use the \`systemPrompt\` field for the main assistant instructions.\\n- Advanced Vapi features (e.g., specific model parameters, tools, server webhooks, metadata) can be added via passthrough fields within the \`customer\`, \`phoneNumber\`, and \`assistant\` objects (including nested objects like \`assistant.model\`). Refer to Vapi documentation for all available options.\\n${commonErrorHandlingDescription}\\nRESPONSE:\\n- On success (200 OK from this node), returns the initial Vapi call object (usually with status \'scheduled\') wrapped in our standard success response. Vapi handles the call progression asynchronously.`, // Reference: https://docs.vapi.ai/api-reference/calls/create
          tags: ["Vapi"],
          requestBody: {
            content: {
              "application/json": {
                schema: CreateCallRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Call creation request accepted. Returns the initial call object wrapped in standard success response.",
              content: {
                "application/json": {
                  schema: CreateCallResponseSchema,
                },
              },
            },
            "500": {
              description: "Error creating Vapi call.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      // Add other Vapi endpoints here later if needed (e.g., GET /call/{id})
    },
  });

  // Add metadata and return correctly typed document
  return {
    ...document,
    meta: {
      tags: ["Voice", "AI", "Calling", "Conversation"],
      provider: "Vapi",
      category: "Conversational AI",
      imageUrl: "https://dashboard.vapi.ai/favicon.ico", // Vapi logo URL (favicon)
      sourceUrl: "https://docs.vapi.ai/", // Link to Vapi docs
      async: false, // The *node* endpoint is synchronous, Vapi handles async call
      complexity: "high", // Complex configuration potential
    },
  } as ZodOpenApiObject;
};
