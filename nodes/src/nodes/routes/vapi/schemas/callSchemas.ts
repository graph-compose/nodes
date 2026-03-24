import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";
import { VapiAuthSchema } from "./sharedSchemas";

// --- Reusable Schemas (Moved shared auth to sharedSchemas.ts) ---

// --- Call Creation Schemas ---

// Customer object schema mirroring Vapi structure
const VapiCustomerSchema = z
  .object({
    number: z.string().openapi({
      description: "The phone number to call in E.164 format.",
      example: "+14035893536",
    }),
    // Add other known customer fields here if desired, e.g., name, extension
  })
  .passthrough()
  .openapi({
    description:
      "Customer details for the outbound call. Allows passthrough for other Vapi customer fields.",
  });

// Phone number object schema mirroring Vapi structure
const VapiPhoneNumberSchema = z
  .object({
    twilioAccountSid: z.string().openapi({
      description: "Your Twilio Account SID used for the outbound call.",
      example: "AC00000000000000000000000000000000",
    }),
    twilioAuthToken: z.string().openapi({
      description: "Your Twilio Auth Token used for the outbound call.",
      example: "your_twilio_auth_token_here",
    }),
    twilioPhoneNumber: z.string().openapi({
      description:
        "The Twilio phone number (E.164 format) to use for the outbound call.",
      example: "+15873248512",
    }),
    // Add other known phoneNumber fields if desired, e.g., name, fallbackDestination
  })
  .passthrough()
  .openapi({
    description:
      "Twilio phone number configuration for the outbound call. Allows passthrough for other Vapi phoneNumber fields.",
  });

// Assistant configuration schemas mirroring Vapi structure
const VapiModelSchema = z
  .object({
    provider: z.string().openapi({
      description: "LLM provider (e.g., 'openai', 'groq').",
      example: "openai",
    }),
    model: z.string().openapi({
      description: "Specific model name (e.g., 'gpt-4', 'llama3-8b-8192').",
      example: "gpt-4",
    }),
    // `messages` field is handled by the service layer using `systemPrompt`.
    // Users can pass other model params like `tools`, `temperature` via passthrough.
  })
  .passthrough()
  .openapi({
    description:
      "LLM model configuration. Allows passthrough for other Vapi model fields (e.g., temperature, tools).",
  });

const VapiVoiceSchema = z
  .object({
    provider: z.string().openapi({
      description: "TTS provider (e.g., '11labs', 'playht').",
      example: "11labs",
    }),
    voiceId: z.string().openapi({
      description: "Specific voice ID from the provider.",
      example: "kdmDKE6EkgrWrrykO9Qt",
    }),
    // Add other voice params like `speed` via passthrough if needed
  })
  .passthrough()
  .openapi({
    description:
      "Text-to-Speech voice configuration. Allows passthrough for other Vapi voice fields (e.g., speed).",
  });

const VapiTranscriberSchema = z
  .object({
    provider: z.string().openapi({
      description: "Transcriber provider (e.g., 'deepgram').",
      example: "deepgram",
    }),
    model: z.string().openapi({
      description: "Specific transcriber model (e.g., 'nova-2').",
      example: "nova-2",
    }),
    language: z.string().optional().openapi({
      description:
        "Language code for transcription (e.g., 'en-GB'). Defaults usually to 'en'.",
      example: "en-GB",
    }),
    // Add other transcriber params like `keywords` via passthrough if needed
  })
  .passthrough()
  .openapi({
    description:
      "Speech-to-Text transcriber configuration. Allows passthrough for other Vapi transcriber fields (e.g., keywords).",
  });

const VapiAssistantSchema = z
  .object({
    firstMessage: z.string().openapi({
      description: "The first message the assistant speaks in the call.",
      example: "Hi, I'm TIFFANY how are you today?",
    }),
    endCallMessage: z.string().optional().openapi({
      description:
        "Optional message spoken by the assistant just before ending the call.",
      example: "Okay, goodbye!",
    }),
    model: VapiModelSchema,
    voice: VapiVoiceSchema,
    transcriber: VapiTranscriberSchema,
    // Users can add other assistant fields like `name`, `metadata`, `endCallPhrases`, `server`, `hooks` via passthrough.
  })
  .passthrough()
  .openapi({
    description:
      "Vapi Assistant configuration for the call. Allows passthrough for other Vapi assistant fields (e.g., name, server, hooks).",
  });

// --- Node's Request Schema: CreateCall ---
export const CreateCallRequestSchema = VapiAuthSchema.extend({
  customer: VapiCustomerSchema,
  phoneNumber: VapiPhoneNumberSchema,
  assistant: VapiAssistantSchema,
  systemPrompt: z.string().openapi({
    description:
      "The system prompt defining the assistant's identity and goals. This will be mapped to assistant.model.messages.",
    example:
      "You are a helpful AI assistant calling from ACME Corp about widgets.",
  }),
  // Allow passthrough for other top-level Vapi call fields (e.g., name, metadata)
})
  .passthrough()
  .openapi({
    description:
      "Request body for POST /nodes/vapi/call/create endpoint. Allows passthrough for other Vapi call fields.",
  });

// --- Node's Response Schema: CreateCall ---

// Vapi call response data schema (simplified + passthrough)
export const CallResultDataSchema = z
  .object({
    id: z
      .string()
      .openapi({ description: "The unique identifier for the call." }),
    status: z.string().openapi({
      description:
        "The initial status of the call (e.g., 'scheduled', 'queued').",
      example: "scheduled",
    }),
    type: z.string().optional().openapi({ description: "Type of the call." }),
    createdAt: z
      .string()
      .datetime()
      .optional()
      .openapi({ description: "Timestamp when the call was created." }),
    // Include other key fields from Vapi response if consistently needed
  })
  .passthrough() // Capture all other fields returned by Vapi
  .openapi({
    description:
      "Core response data from Vapi after successfully creating a call. Includes Vapi passthrough fields.",
  });

// Standardized Success Response wrapper for Create Call
export const CreateCallResponseSchema =
  SuccessResponseSchema(CallResultDataSchema);

// --- Type Exports ---
export type CreateCallRequest = z.infer<typeof CreateCallRequestSchema>;
export type CreateCallResponse = z.infer<typeof CreateCallResponseSchema>;
export type VapiAssistant = z.infer<typeof VapiAssistantSchema>; // Export for service layer
