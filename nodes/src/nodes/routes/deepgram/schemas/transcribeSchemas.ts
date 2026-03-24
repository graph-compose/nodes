import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";
import { DeepgramAuthSchema } from "./speakSchemas"; // Re-use auth schema

// Common OpenAPI tags for Deepgram schemas
const DEEPGRAM_TAGS = ["Deepgram"] as const;

// --- Request Schema ---

// Define common Deepgram STT options based on documentation
// https://developers.deepgram.com/docs/pre-recorded-audio
const DeepgramSttOptionsSchema = z
  .object({
    model: z.string().optional().openapi({
      description:
        "AI model (e.g., `nova-2`, `whisper-large`). Default inferred by Deepgram.",
      example: "nova-2",
    }),
    language: z.string().optional().openapi({
      description:
        "Audio language (BCP-47 tag, e.g., `en-US`, `es`). Default: `en`.",
      example: "en-US",
    }),
    smart_format: z.boolean().optional().openapi({
      description:
        "Apply smart formatting (numbers, dates, currency, etc.). Default: false.",
      example: true,
    }),
    punctuate: z.boolean().optional().openapi({
      description: "Add punctuation and capitalization. Default: false.",
      example: true,
    }),
    diarize: z.boolean().optional().openapi({
      description:
        "Identify different speakers (speaker diarization). Default: false.",
      example: true,
    }),
    paragraphs: z.boolean().optional().openapi({
      description: "Segment transcript into paragraphs. Default: false.",
      example: true,
    }),
    utterances: z.boolean().optional().openapi({
      description:
        "Segment transcript into utterances based on silence. Default: false.",
      example: true,
    }),
    keywords: z
      .array(z.string())
      .optional()
      .openapi({
        description:
          "Keywords to spot in the audio (boosts their recognition).",
        example: ["deepgram", "transcription"],
      }),
  })
  .passthrough()
  .openapi({
    description: "Common options for Deepgram Speech-to-Text",
    "x-tags": DEEPGRAM_TAGS,
  });

export const TranscribeUrlRequestSchema = DeepgramAuthSchema.extend({
  url: z.string().url().openapi({
    description:
      "Publicly accessible URL of the audio/video file to transcribe.",
    example:
      "https://static.deepgram.com/examples/interview_speech-analytics.wav",
  }),
})
  .merge(DeepgramSttOptionsSchema) // Merge STT options into the request
  .openapi({
    description: "Request body for transcribing audio from a URL.",
    "x-tags": DEEPGRAM_TAGS,
  });

// --- Response Schemas ---

// Based on example structure from https://developers.deepgram.com/docs/pre-recorded-audio#analyze-the-response
// Note: This is a simplified version; the actual response can be very complex.

const WordSchema = z
  .object({
    word: z
      .string()
      .openapi({ description: "The transcribed word.", example: "Deepgram" }),
    start: z
      .number()
      .openapi({ description: "Start time (seconds).", example: 0.5 }),
    end: z
      .number()
      .openapi({ description: "End time (seconds).", example: 1.1 }),
    confidence: z
      .number()
      .openapi({ description: "Confidence score (0-1).", example: 0.98 }),
    punctuated_word: z
      .string()
      .optional()
      .openapi({
        description: "Word with punctuation (if enabled).",
        example: "Deepgram.",
      }),
    speaker: z
      .number()
      .int()
      .optional()
      .openapi({
        description: "Speaker index (if diarize enabled).",
        example: 0,
      }),
  })
  .passthrough()
  .openapi({
    description: "Individual word details in the transcript",
    "x-tags": DEEPGRAM_TAGS,
  });

const AlternativeSchema = z
  .object({
    transcript: z
      .string()
      .openapi({
        description: "The full transcript string for this alternative.",
        example: "Hello Deepgram world.",
      }),
    confidence: z
      .number()
      .openapi({
        description: "Overall confidence score for this alternative (0-1).",
        example: 0.95,
      }),
    words: z
      .array(WordSchema)
      .openapi({ description: "Array of word objects for this transcript." }),
  })
  .passthrough()
  .openapi({
    description: "A single transcription alternative",
    "x-tags": DEEPGRAM_TAGS,
  });

const ChannelSchema = z
  .object({
    alternatives: z
      .array(AlternativeSchema)
      .nonempty()
      .openapi({
        description:
          "Array of transcription alternatives (usually 1 unless N-best is used).",
      }),
  })
  .passthrough()
  .openapi({
    description: "Transcription results for a single audio channel",
    "x-tags": DEEPGRAM_TAGS,
  });

const MetadataSchema = z
  .object({
    request_id: z
      .string()
      .openapi({
        description: "Deepgram request identifier.",
        example: "req-1234-abcd-5678-efgh",
      }),
    created: z
      .string()
      .datetime()
      .openapi({
        description: "Timestamp of request creation (ISO 8601).",
        example: "2024-03-21T14:30:00.123Z",
      }),
    duration: z
      .number()
      .openapi({
        description: "Duration of the audio processed (seconds).",
        example: 15.75,
      }),
    channels: z
      .number()
      .int()
      .openapi({
        description: "Number of audio channels detected.",
        example: 1,
      }),
    model_info: z
      .record(z.any())
      .optional()
      .openapi({ description: "Information about the model used." }), // Example: { name: "nova-2", version: "..." }
  })
  .passthrough()
  .openapi({
    description: "Metadata associated with the transcription request",
    "x-tags": DEEPGRAM_TAGS,
  });

const ResultsSchema = z
  .object({
    channels: z
      .array(ChannelSchema)
      .nonempty()
      .openapi({ description: "Transcription results per audio channel." }),
    // Optional results based on features enabled
    utterances: z
      .array(z.any())
      .optional()
      .openapi({ description: "Detected utterances (if utterances=true)." }),
    paragraphs: z
      .any()
      .optional()
      .openapi({
        description: "Paragraph segmentation results (if paragraphs=true).",
      }),
    summary: z
      .any()
      .optional()
      .openapi({
        description: "Summarization results (if summary features enabled).",
      }),
  })
  .passthrough()
  .openapi({
    description:
      "Container for transcription results, including channels and optional features",
    "x-tags": DEEPGRAM_TAGS,
  });

export const TranscribeResultDataSchema = z
  .object({
    metadata: MetadataSchema,
    results: ResultsSchema,
  })
  .passthrough()
  .openapi({
    description:
      "Complete response data structure for a successful transcription.",
    "x-tags": DEEPGRAM_TAGS,
  });

// Wrapped response schema
export const TranscribeUrlResponseSchema = SuccessResponseSchema(
  TranscribeResultDataSchema,
).openapi({
  description: "Standard success response for the transcription operation.",
  "x-tags": DEEPGRAM_TAGS,
});
