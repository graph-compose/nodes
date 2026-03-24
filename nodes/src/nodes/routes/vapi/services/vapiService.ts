import axios from "axios";
import { z } from "zod";
import {
  CallResultDataSchema,
  CreateCallRequest, // Import the specific request type
  VapiAssistant, // Type for assistant object manipulation
} from "../schemas/callSchemas";

const VAPI_API_BASE_URL = "https://api.vapi.ai";

// Type for the actual payload sent to Vapi API
// We reconstruct this from our simplified request
interface VapiApiPayload {
  customer: object;
  phoneNumber: object;
  assistant: VapiAssistant & {
    model: { messages: { role: string; content: string }[] };
  }; // Ensure messages structure
  // Allow other top-level fields from Vapi docs
  [key: string]: any;
}

// Renamed function to reflect the specific action
export const createVapiCall = async (
  request: CreateCallRequest,
): Promise<z.infer<typeof CallResultDataSchema>> => {
  const { apiKey, systemPrompt, ...restOfRequest } = request;

  // Start constructing the Vapi payload
  // Use structuredClone for deep copying to avoid modifying the original request object
  const vapiPayload: VapiApiPayload = structuredClone({
    ...restOfRequest, // Include customer, phoneNumber, assistant, and any other top-level fields passed through
    assistant: {
      ...restOfRequest.assistant, // Spread existing assistant fields
      model: {
        ...restOfRequest.assistant.model, // Spread existing model fields (provider, model, passthrough)
        messages: [
          {
            role: "system",
            content: systemPrompt, // Inject the system prompt here
          },
        ],
        // If user provided messages via passthrough on assistant.model, they will be overwritten.
        // This is the intended behavior based on abstracting systemPrompt.
        // Consider adding user messages from passthrough if needed in the future.
      },
    },
  });

  try {
    const response = await axios.post(
      `${VAPI_API_BASE_URL}/call`,
      vapiPayload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Use Zod schema to parse and validate the response from Vapi
    // This ensures we handle the known fields correctly and capture others via passthrough
    const validatedResponse = CallResultDataSchema.safeParse(response.data);

    if (!validatedResponse.success) {
      console.error(
        "[VapiService] Vapi API response validation failed:",
        validatedResponse.error.errors,
      );
      throw new Error(
        `Failed to validate Vapi API response: ${validatedResponse.error.message}`,
      );
    }

    return validatedResponse.data;
  } catch (error) {
    console.error("[VapiService] Error calling Vapi createCall:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "[VapiService] Vapi Create Call API Error Response:",
        error.response.data,
      );
      // Extract Vapi specific error message if available
      const vapiError =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message;
      throw new Error(`Vapi API request failed: ${vapiError}`);
    } else if (
      error instanceof Error &&
      error.message.startsWith("Failed to validate Vapi API response")
    ) {
      // Re-throw validation error
      throw error;
    }
    throw new Error(
      "An unexpected error occurred while creating the Vapi call.",
    );
  }
};
