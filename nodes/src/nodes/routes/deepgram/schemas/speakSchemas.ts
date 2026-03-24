import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";

// Common OpenAPI tags for Deepgram schemas
const DEEPGRAM_TAGS = ["Deepgram"] as const;

// --- Types moved from types.ts ---

// Common authentication interface
export interface DeepgramAuth {
  apiKey: string; // Deepgram API Key
}

// Interface for options passed as query parameters to Deepgram TTS
// Note: These are implicitly handled by SpeakRequestSchema fields now
// export interface DeepgramTtsOptions { ... } // Removed as redundant

// Interface for relevant Deepgram response headers
export interface DeepgramResponseHeaders {
  "dg-request-id"?: string;
  "dg-model-uuid"?: string;
  "dg-model-name"?: string;
  "dg-char-count"?: string;
  "content-type"?: string; // Important for saving/uploading the audio correctly
}

// --- Schemas moved from schema.ts ---

export const DeepgramAuthSchema = z
  .object({
    apiKey: z.string().min(1).openapi({
      description: "Your Deepgram API Key.",
      example: "abcdef1234567890abcdef1234567890abcdef12",
    }),
  })
  .openapi({
    description: "Authentication using a Deepgram API key",
    "x-tags": DEEPGRAM_TAGS,
  });

export const SpeakRequestSchema = DeepgramAuthSchema.extend({
  text: z.string().max(2000).openapi({
    description: "The text to synthesize into speech. Max 2000 characters.",
    example:
      "Hello world! This is an example of text-to-speech using Deepgram.",
  }),
  model: z.string().optional().default("aura-asteria-en").openapi({
    description:
      "Voice model ID. See Deepgram docs for options (e.g., `aura-asteria-en`, `aura-luna-en`). Default: `aura-asteria-en`.",
    example: "aura-luna-en",
  }),
  // Output format options (will be passed as query params)
  encoding: z
    .enum([
      "linear16", // 16-bit PCM
      "mulaw", // Mu-law
      "alaw", // A-law
      "mp3", // MP3 (default)
      "opus", // Ogg Opus
      "flac", // FLAC
      "aac", // AAC
    ])
    .optional()
    .default("mp3") // Set the documented default
    .openapi({
      description:
        "Output audio encoding. Default: `mp3`. Options: `linear16`, `mulaw`, `alaw`, `mp3`, `opus`, `flac`, `aac`.",
      example: "linear16",
    }),
  container: z
    .enum([
      "wav", // Wave container
      "ogg", // Ogg container (often used with opus)
      // Note: Deepgram might support others implicitly via encoding (e.g., mp3 implies mp3 container)
      // but explicitly defining known containers is safer.
      // Default behavior when omitted seems tied to encoding (e.g., mp3 encoding defaults to mp3 container).
    ])
    .optional()
    .openapi({
      description:
        "Output audio container (e.g., `wav`, `ogg`). Often inferred from encoding if omitted.",
      example: "wav",
    }),
  sample_rate: z.number().int().optional().openapi({
    description:
      "Sample rate in Hz. Valid values depend on model/encoding. See Deepgram 'Audio Format Combinations'.",
    example: 24000,
  }),
  bit_rate: z.number().int().optional().openapi({
    description:
      "Bit rate in bits/sec. Valid values depend on encoding. See Deepgram 'Audio Format Combinations'.",
    example: 128000, // Example for mp3
  }),
  // Add other query param options here if needed
}).openapi({
  description: "Request body for text-to-speech generation.",
  "x-tags": DEEPGRAM_TAGS,
});

// Infer the type for internal use if needed, but don't export it directly from schema file
// export type SpeakRequest = z.infer<typeof SpeakRequestSchema>;

// Response data schema for a successful TTS generation
export const SpeakResultDataSchema = z
  .object({
    audioUrl: z.string().url().openapi({
      description: "Publicly accessible URL of the generated audio file.",
      example: "https://storage.googleapis.com/your-bucket/audio_output.mp3",
    }),
    contentType: z.string().optional().openapi({
      description:
        "Content type of the generated audio file (e.g., `audio/mpeg`, `audio/wav`).",
      example: "audio/mpeg",
    }),
    requestId: z.string().optional().openapi({
      description: "Deepgram request ID for tracking and support.",
      example: "req-1234-abcd-5678-efgh",
    }),
    modelName: z.string().optional().openapi({
      description: "Name of the Deepgram TTS model used.",
      example: "aura-luna-en",
    }),
    modelUuid: z.string().optional().openapi({
      description: "UUID of the Deepgram TTS model used.",
      example: "model-uuid-5678-wxyz",
    }),
    charCount: z.string().optional().openapi({
      description: "Number of characters synthesized (returned as string).",
      example: "62",
    }),
  })
  .passthrough()
  .openapi({
    description:
      "Response data containing the URL and metadata of the generated audio.",
  });

// Wrapped response schema
export const SpeakResponseSchema = SuccessResponseSchema(SpeakResultDataSchema);

// Infer the type for internal use if needed, but don't export it directly from schema file
// export type SpeakResponse = z.infer<typeof SpeakResponseSchema>;
