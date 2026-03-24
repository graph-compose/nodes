import { z } from "zod";
import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";

// Replace audio request schema
export const ReplaceAudioRequestSchema = z
  .object({
    videoUrl: z
      .string()
      .url()
      .openapi({
        description: "URL of the source video whose audio track will be replaced (MP4 format)",
        example: "https://storage.googleapis.com/your-bucket/original_video.mp4",
      }),
    audioUrl: z
      .string()
      .url()
      .openapi({
        description: "URL of the replacement audio track (MP3 or any FFmpeg-supported format)",
        example: "https://storage.googleapis.com/your-bucket/dubbed_audio.mp3",
      }),
    label: z.string().optional().openapi({
      description: "Optional label used in the output filename (e.g. language code)",
      example: "es",
    }),
  })
  .openapi({
    description: "Request body for replacing a video's audio track",
  });

// Replace audio response data schema
export const ReplaceAudioDataSchema = z
  .object({
    videoUrl: z.string().url().openapi({
      description: "Public URL of the dubbed video (expires in 1 day)",
      example: "https://storage.googleapis.com/your-bucket/dubbed/es-abc123.mp4",
    }),
    label: z.string().optional().openapi({
      description: "Label from the request, echoed back",
      example: "es",
    }),
    duration: z.number().openapi({
      description: "Duration of the output video in seconds",
      example: 234,
    }),
  })
  .openapi({
    description: "Result of the audio replacement operation",
  });

// Full response schema
const ReplaceAudioResponseSchema = SuccessResponseSchema(ReplaceAudioDataSchema);

// Types
export type ReplaceAudioRequest = z.infer<typeof ReplaceAudioRequestSchema>;
export type ReplaceAudioData = z.infer<typeof ReplaceAudioDataSchema>;

// OpenAPI document
export const createOpenApiDocument = () => {
  const doc = createDocument({
    openapi: "3.0.3" as const,
    info: {
      title: "Video Audio Replacement API",
      version: "1.0.0",
      description: `Replaces the audio track of a video with a new audio file.

## Use Case
Given a video URL and a replacement audio URL, this endpoint strips the original audio, merges in the new track, and returns a public URL for the dubbed video.

This is useful for workflows that:
1. Transcribe a video and translate the transcript to another language.
2. Generate TTS audio in the target language.
3. Merge the new audio onto the original video to produce a dubbed version.

## How It Works
1. Provide a \`videoUrl\` (MP4) and an \`audioUrl\` (MP3 or similar).
2. FFmpeg replaces the audio track using stream copy for the video (no re-encoding).
3. The output is clipped to the shorter of the two streams via \`-shortest\`.
4. The dubbed video is uploaded to temporary cloud storage.
5. A public URL (expires in 1 day) is returned.

## Limits
- Source video and audio must be accessible via URL.
- Output URL is temporary and expires after 1 day.`,
    },
    paths: {
      "/replace-audio": {
        post: {
          summary: "Replace a video's audio track",
          description: `Takes a video URL and a replacement audio URL, strips the original audio, and merges in the new track using FFmpeg.

**Workflow:**
1. Provide the source video URL and the replacement audio URL.
2. FFmpeg merges the video stream (copied, no re-encoding) with the new audio.
3. The output is trimmed to the shorter of the two streams.
4. The result is uploaded to temporary cloud storage (1-day expiry).
5. Returns the dubbed video URL, label, and duration.

**Full Path:** /nodes/video/replace-audio`,
          tags: ["Video Utils"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: ReplaceAudioRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Audio replaced successfully. Returns a temporary URL that expires after 1 day.",
              content: {
                "application/json": {
                  schema: ReplaceAudioResponseSchema,
                },
              },
            },
            "400": {
              description: "Invalid request (e.g., invalid URL format).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "404": {
              description: "Video or audio not found at the provided URL.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "500": {
              description:
                "Server error during processing or upload (e.g., FFmpeg error, storage issue).",
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

  return {
    ...doc,
    meta: {
      tags: ["video", "audio", "dub", "replace", "ffmpeg", "localization"],
      provider: "FFmpeg",
      category: "video",
      sourceUrl: "https://ffmpeg.org/",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/FFmpeg_Latest_logo.svg/1200px-FFmpeg_Latest_logo.svg.png",
      description:
        "Replace a video's audio track with a new audio file. Uses FFmpeg stream copy for fast processing without re-encoding the video. Ideal for dubbed or localized video production.",
      features: [
        "Fast video stream copy (no re-encoding)",
        "Supports any FFmpeg-compatible audio format",
        "Automatic GCS upload with temporary URLs",
        "Optional label for output filename",
      ],
      pricing: "Open source and free to use",
      documentation: "https://ffmpeg.org/documentation.html",
      async: true,
      complexity: "low",
    },
  };
};
