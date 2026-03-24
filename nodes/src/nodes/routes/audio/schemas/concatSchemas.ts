import { z } from "zod";
import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";

export const AudioConcatRequestSchema = z
  .object({
    audioUrls: z.array(z.string().url()).min(1).openapi({
      description: "Ordered array of audio file URLs to concatenate (MP3 or any FFmpeg-supported format)",
      example: [
        "https://storage.googleapis.com/bucket/chunk_0.mp3",
        "https://storage.googleapis.com/bucket/chunk_1.mp3",
      ],
    }),
    targetDurations: z
      .array(z.number().positive())
      .optional()
      .openapi({
        description: `Optional array of target durations in seconds, one per audio URL. When provided, each audio chunk is fitted to its target duration before concatenation:
- **Too short** (TTS faster than original): silence is padded at the end using FFmpeg \`apad\`.
- **Too long** (TTS slower than original): audio is sped up using \`atempo\` (max 2× per filter; chained for up to 4× total). If the required speed-up exceeds 4×, the audio is accepted as-is rather than being distorted.

Get these values from \`results.<forEach>.data.items.data.duration\` after an \`endForEach\` node when using the segment-aware \`/nodes/text/chunk\` endpoint.`,
        example: [42.8, 38.1, 51.3],
      }),
  })
  .openapi({ description: "Request body for concatenating and optionally time-fitting audio files" });

export const AudioConcatDataSchema = z
  .object({
    audioUrl: z.string().url().openapi({
      description: "Public GCS URL of the concatenated audio file",
      example: "https://storage.googleapis.com/bucket/audio-concat/abc123.mp3",
    }),
    duration: z.number().openapi({
      description: "Total duration of the concatenated audio in seconds",
      example: 312.5,
    }),
    totalFiles: z.number().int().openapi({
      description: "Number of audio files that were concatenated",
      example: 4,
    }),
    fittingApplied: z.boolean().openapi({
      description: "Whether targetDurations was provided and timing fitting was applied",
      example: true,
    }),
  })
  .openapi({ description: "Result of the audio concatenation operation" });

const AudioConcatResponseSchema = SuccessResponseSchema(AudioConcatDataSchema);

export type AudioConcatRequest = z.infer<typeof AudioConcatRequestSchema>;
export type AudioConcatData = z.infer<typeof AudioConcatDataSchema>;

export const createOpenApiDocument = () => {
  const doc = createDocument({
    openapi: "3.0.3" as const,
    info: {
      title: "Audio Concatenation API",
      version: "2.0.0",
      description: `Concatenates multiple audio files into a single file, with optional per-chunk timing fitting.

## Basic Usage
Provide an ordered array of audio URLs. Files are downloaded, concatenated with FFmpeg stream copy, and uploaded to GCS.

## Time-Aligned Dubbing
When dubbing video, TTS-generated audio rarely matches the original segment duration.
Provide \`targetDurations\` (one per audio URL) to fit each chunk to its original timing:

- **Shorter than target**: padded with silence at the end — the dubbed voice finishes, then a natural pause before the next sentence.
- **Longer than target**: sped up with FFmpeg \`atempo\` (capped at 4× total via chained filters). Above 4× the audio is accepted as-is.

The \`targetDurations\` values come from the \`duration\` field returned by \`/nodes/text/chunk\` (which in turn comes from Whisper segment timestamps).

## Typical Workflow
\`\`\`
chunk_transcript → forEach chunks → translate → generate_tts → endForEach
  → concat_audio (audioUrls = items.results.generate_tts…audioUrl, targetDurations = items.data.duration)
    → replace_audio
\`\`\``,
    },
    paths: {
      "/concat": {
        post: {
          summary: "Concatenate audio files with optional time-aligned fitting",
          description: `Takes an ordered array of audio URLs and joins them. Optionally fits each chunk to a target duration before joining.\n\n**Full Path:** /nodes/audio/concat`,
          tags: ["Audio Utils"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: AudioConcatRequestSchema } },
          },
          responses: {
            "200": {
              description: "Audio concatenated (and optionally fitted) successfully.",
              content: { "application/json": { schema: AudioConcatResponseSchema } },
            },
            "400": {
              description: "Invalid request (e.g. empty array, targetDurations length mismatch).",
              content: { "application/json": { schema: ApiErrorResponseSchema } },
            },
            "500": {
              description: "Server error during FFmpeg processing or GCS upload.",
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
      tags: ["audio", "concat", "ffmpeg", "tts", "dubbing", "timing"],
      provider: "FFmpeg",
      category: "audio",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/53/FFmpeg_Logo_new.svg",
      sourceUrl: "https://ffmpeg.org/",
      description:
        "Concatenate audio files with optional time-aligned fitting. Pads short chunks with silence and speeds up long chunks so dubbed audio stays in sync with the original video.",
      features: [
        "Stream copy concatenation (no re-encoding when no fitting needed)",
        "Silence padding for short TTS chunks (apad)",
        "Speed adjustment for long TTS chunks (atempo, up to 4×)",
        "GCS upload with public URL",
      ],
      pricing: "Open source and free to use",
      documentation: "https://ffmpeg.org/documentation.html",
      async: true,
      complexity: "medium",
    },
  };
};
