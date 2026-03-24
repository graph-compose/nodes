import { z } from "zod";
import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";

// Matches the segment shape returned by OpenAI Whisper verbose_json
export const WhisperSegmentSchema = z
  .object({
    id: z.number().int().openapi({ description: "Segment index from Whisper", example: 0 }),
    start: z.number().openapi({ description: "Segment start time in seconds", example: 0.0 }),
    end: z.number().openapi({ description: "Segment end time in seconds", example: 4.52 }),
    text: z.string().openapi({ description: "Transcribed text for this segment", example: " Welcome to the demo." }),
  })
  .openapi({ description: "A single Whisper transcript segment with timing" });

export const ChunkTextRequestSchema = z
  .object({
    segments: z.array(WhisperSegmentSchema).min(1).openapi({
      description: "Whisper verbose_json segments array (from OpenAI /v1/audio/transcriptions with response_format=verbose_json)",
    }),
    maxChars: z.number().int().min(100).max(10000).default(3500).openapi({
      description:
        "Maximum characters per chunk (default 3500 — leaves headroom for translation expansion before the ElevenLabs 5000 char limit)",
      example: 3500,
    }),
  })
  .openapi({ description: "Request body for grouping Whisper segments into time-aligned chunks" });

export const ChunkSchema = z
  .object({
    index: z.number().int().openapi({ description: "Zero-based chunk index (preserves order for later assembly)", example: 0 }),
    text: z.string().openapi({ description: "Combined text of all segments in this chunk", example: "Welcome to the demo. Today we'll explore..." }),
    startTime: z.number().openapi({ description: "Start time of the first segment in this chunk, in seconds", example: 0.0 }),
    endTime: z.number().openapi({ description: "End time of the last segment in this chunk, in seconds", example: 42.8 }),
    duration: z.number().openapi({
      description: "Duration of this chunk in seconds (endTime - startTime). Use as targetDuration when calling /nodes/audio/concat.",
      example: 42.8,
    }),
    segmentCount: z.number().int().openapi({ description: "Number of Whisper segments merged into this chunk", example: 12 }),
  })
  .openapi({ description: "A time-aligned text chunk ready for translation and TTS" });

export const ChunkTextDataSchema = z
  .object({
    chunks: z.array(ChunkSchema).openapi({
      description: "Ordered array of chunks. Each chunk has text + timing metadata. Feed this array directly into a forEach node.",
    }),
    totalChunks: z.number().int().openapi({ description: "Total number of chunks produced", example: 4 }),
    totalDuration: z.number().openapi({ description: "Total transcript duration in seconds (endTime of last chunk)", example: 312.5 }),
    totalChars: z.number().int().openapi({ description: "Total characters across all segment texts", example: 9840 }),
  })
  .openapi({ description: "Result of the segment-aware chunking operation" });

const ChunkTextResponseSchema = SuccessResponseSchema(ChunkTextDataSchema);

export type WhisperSegment = z.infer<typeof WhisperSegmentSchema>;
export type ChunkTextRequest = z.infer<typeof ChunkTextRequestSchema>;
export type ChunkTextData = z.infer<typeof ChunkTextDataSchema>;

export const createOpenApiDocument = () => {
  const doc = createDocument({
    openapi: "3.0.3" as const,
    info: {
      title: "Text Chunk API (Segment-Aware)",
      version: "2.0.0",
      description: `Groups Whisper transcript segments into time-aligned text chunks for dubbed audio pipelines.

## Problem
TTS APIs (e.g. ElevenLabs) have character limits (~5000 chars). Long video transcripts must be split before
translation and TTS. A naive character split creates chunks that don't align with the original video timing,
causing the dubbed audio to drift out of sync.

## Solution
This endpoint works with Whisper's **\`verbose_json\`** output, which provides word/segment-level timestamps.
Segments are greedily grouped until a chunk would exceed \`maxChars\`, always breaking on segment boundaries.
Each output chunk carries **\`startTime\`**, **\`endTime\`**, and **\`duration\`** — enabling downstream audio
fitting to match the original timing.

## Workflow Integration
\`\`\`
transcribe_audio (verbose_json)
  → chunk_transcript (this endpoint, feeds segments)
    → forEach over chunks
      → translate (use row.data.text)
      → generate_tts (use translated text)
    → endForEach
      → concat_audio (pass targetDurations from items.data.duration)
        → replace_audio
\`\`\``,
    },
    paths: {
      "/chunk": {
        post: {
          summary: "Group Whisper segments into time-aligned chunks",
          description: `Accepts Whisper \`verbose_json\` segments and groups them into chunks ≤ \`maxChars\` while preserving timing metadata.\n\n**Full Path:** /nodes/text/chunk`,
          tags: ["Text Utils"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: ChunkTextRequestSchema } },
          },
          responses: {
            "200": {
              description: "Segments grouped into chunks successfully.",
              content: { "application/json": { schema: ChunkTextResponseSchema } },
            },
            "400": {
              description: "Invalid request (e.g. empty segments array).",
              content: { "application/json": { schema: ApiErrorResponseSchema } },
            },
            "500": {
              description: "Server error.",
              content: { "application/json": { schema: ApiErrorResponseSchema } },
            },
          },
        },
      },
    },
  });

  return {
    ...doc,
    meta: {
      tags: ["text", "chunk", "whisper", "transcript", "dubbing"],
      provider: "Built-in",
      category: "text",
      imageUrl: "https://storage.cloud.google.com/graph-compose-public/llm.png",
      sourceUrl: "https://platform.openai.com/docs/guides/speech-to-text",
      description:
        "Group Whisper transcript segments into time-aligned chunks for dubbed audio pipelines. Preserves timing metadata so downstream audio can be fitted to the original video duration.",
      features: [
        "Segment-boundary chunking (no mid-sentence splits)",
        "Preserves startTime / endTime / duration per chunk",
        "Works directly with Whisper verbose_json output",
        "Configurable max chunk size for TTS character limits",
      ],
      pricing: "Free",
      async: false,
      complexity: "low",
    },
  };
};
