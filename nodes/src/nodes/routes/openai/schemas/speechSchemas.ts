import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";

// Common OpenAPI tags for OpenAI schemas
const OPENAI_TAGS = ["OpenAI"] as const;

// Shared Authentication Schema (re-used from visionSchemas or defined here)
// Assuming it's defined here for clarity if not imported
const OpenAIApiKeySchema = z
  .object({
    apiKey: z.string().min(1).openapi({
      description: "Your OpenAI API key",
      example: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    }),
  })
  .openapi({
    description: "Authentication using an OpenAI API key.",
    "x-tags": OPENAI_TAGS,
  });

// Schema for the request body
export const TranscribeSpeechRequestSchema = OpenAIApiKeySchema.extend({
  audioUrl: z.string().url("Invalid URL provided.").openapi({
    description: "Publicly accessible URL of the audio file to transcribe.",
    example: "https://example.com/audio.mp3",
  }),
  model: z.enum(["whisper-1"]).default("whisper-1").openapi({
    description: "The transcription model to use.",
    example: "whisper-1",
  }),
  language: z.string().length(2).optional().openapi({
    description:
      "Optional: Language of the input audio (ISO-639-1 format). Improves accuracy.",
    example: "en",
  }),
  prompt: z.string().optional().openapi({
    description:
      "Optional: Text to guide the model's style or provide context (e.g., names).",
    example: "The speakers are discussing Whisper and OpenAI.",
  }),
  temperature: z.number().min(0).max(1).optional().default(0).openapi({
    description:
      "Sampling temperature (0-1). Higher = more random, lower = more deterministic. Default: 0.",
    example: 0.2,
  }),
  responseFormat: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .default("json")
    .openapi({
      description: "Output format for the transcript.",
      example: "verbose_json",
    }),
}).openapi({
  description: "Request body for the Speech-to-Text transcription endpoint.",
  "x-tags": OPENAI_TAGS,
});

// Schema for the core response data (when format is json or verbose_json)
const StructuredTranscriptionDataSchema = z
  .object({
    text: z.string().openapi({
      description: "The full transcribed text.",
      example: "Hello world. Welcome to the transcription API.",
    }),
    language: z.string().optional().openapi({
      description: "Detected language of the audio (ISO-639-1).",
      example: "en",
    }),
    duration: z.number().optional().openapi({
      description: "Duration of the audio file in seconds.",
      example: 15.35,
    }),
    segments: z
      .array(
        z
          .object({
            id: z
              .number()
              .int()
              .openapi({ description: "Segment ID", example: 0 }),
            seek: z
              .number()
              .int()
              .optional()
              .openapi({ description: "Seek offset" }),
            start: z
              .number()
              .openapi({ description: "Start time (seconds)", example: 0.0 }),
            end: z
              .number()
              .openapi({ description: "End time (seconds)", example: 5.2 }),
            text: z.string().openapi({
              description: "Text of the segment",
              example: " Hello world. ",
            }),
            tokens: z
              .array(z.number().int())
              .optional()
              .openapi({ description: "Token IDs" }),
            temperature: z
              .number()
              .optional()
              .openapi({ description: "Segment temperature" }),
            avg_logprob: z
              .number()
              .optional()
              .openapi({ description: "Average log probability" }),
            compression_ratio: z
              .number()
              .optional()
              .openapi({ description: "Compression ratio" }),
            no_speech_prob: z
              .number()
              .optional()
              .openapi({ description: "No speech probability" }),
            confidence: z
              .number()
              .optional()
              .openapi({ description: "Confidence score (verbose_json only)" }),
            words: z
              .array(
                z.object({
                  word: z.string(),
                  start: z.number(),
                  end: z.number(),
                  confidence: z.number().optional(),
                }),
              )
              .optional()
              .openapi({
                description: "Word-level timestamps (verbose_json only)",
              }),
          })
          .passthrough(),
      )
      .optional()
      .openapi({
        description:
          "Detailed segments with timing (verbose_json) or just text segments (json).",
      }),
  })
  .passthrough()
  .openapi({
    description:
      "Core structured data returned for `json` or `verbose_json` transcription.",
    "x-tags": OPENAI_TAGS,
  });

// Union for the actual data field in the success response
const TranscriptionResultDataSchema = z
  .union([
    StructuredTranscriptionDataSchema,
    z.string().openapi({
      description: "Plain text transcript (for `text`, `srt`, `vtt` formats).",
      example: "Hello world. Welcome.",
    }),
  ])
  .openapi({
    description:
      "The transcription result, either structured JSON or plain text string depending on requested format.",
    "x-tags": OPENAI_TAGS,
  });

// Standard success response wrapper
export const TranscribeSpeechResponseSchema = SuccessResponseSchema(
  TranscriptionResultDataSchema,
).openapi({
  description: "Standard success response for speech transcription.",
  "x-tags": OPENAI_TAGS,
});

// Type Exports
export type TranscribeSpeechRequest = z.infer<
  typeof TranscribeSpeechRequestSchema
>;
export type TranscribeSpeechResponse = z.infer<
  typeof TranscribeSpeechResponseSchema
>;
