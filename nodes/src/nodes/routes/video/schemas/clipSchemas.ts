import { z } from "zod";
import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";

// Individual segment definition
const ClipSegmentSchema = z.object({
  start: z
    .number()
    .min(0)
    .openapi({ description: "Start time in seconds", example: 134 }),
  end: z.number().min(0).openapi({
    description: "End time in seconds (must be greater than start)",
    example: 225,
  }),
  label: z.string().optional().openapi({
    description:
      "Optional label for this segment, used in the output filename",
    example: "intro_highlight",
  }),
});

// Clip request schema
export const ClipRequestSchema = z
  .object({
    videoUrl: z
      .string()
      .url()
      .openapi({
        description: "URL of the source video to clip from (MP4 format)",
        example:
          "https://storage.googleapis.com/your-bucket/downloaded_video.mp4",
      }),
    segments: z.array(ClipSegmentSchema).min(1).max(20).openapi({
      description:
        "Array of time segments to extract. Each segment produces one clip. Maximum 20 segments per request.",
    }),
  })
  .openapi({
    description: "Request body for clipping video segments",
  });

// Individual clip result
const ClipResultItemSchema = z.object({
  label: z.string().openapi({
    description: "Label for this clip (from request or auto-generated)",
    example: "intro_highlight",
  }),
  url: z.string().url().openapi({
    description: "Public URL of the clip (expires in 1 day)",
    example: "https://storage.googleapis.com/your-bucket/clips/abc123.mp4",
  }),
  duration: z.number().openapi({
    description: "Duration of the clip in seconds",
    example: 91,
  }),
  start: z.number().openapi({
    description: "Start time of the clip in the source video (seconds)",
    example: 134,
  }),
  end: z.number().openapi({
    description: "End time of the clip in the source video (seconds)",
    example: 225,
  }),
});

// Clip response data schema
export const ClipDataSchema = z.object({
  clips: z.array(ClipResultItemSchema).openapi({
    description: "Array of extracted clips with their public URLs",
  }),
  totalClips: z
    .number()
    .int()
    .openapi({ description: "Total number of clips produced", example: 3 }),
});

// Full response schema
const ClipResponseSchema = SuccessResponseSchema(ClipDataSchema);

// Types
export type ClipRequest = z.infer<typeof ClipRequestSchema>;
export type ClipData = z.infer<typeof ClipDataSchema>;

// Create OpenAPI document
export const createOpenApiDocument = () => {
  const doc = createDocument({
    openapi: "3.0.3" as const,
    info: {
      title: "Video Clip Extraction API",
      version: "1.0.0",
      description: `Extracts one or more clips from a video file based on start/end timestamps.

## Use Case
Given a video URL and an array of time segments, this endpoint produces individual MP4 clips for each segment and uploads them to temporary cloud storage.

This is useful for workflows that:
1. Transcribe a video and use an LLM to identify interesting segments.
2. Extract those segments as individual clips.
3. Email, share, or further process the clips.

## How It Works
1. Provide a \`videoUrl\` (MP4) and an array of \`segments\` with \`start\`/\`end\` timestamps.
2. Each segment is extracted using FFmpeg with stream copy (fast, no re-encoding).
3. Clips are uploaded to temporary cloud storage.
4. An array of public URLs (expire in 1 day) is returned.

## Limits
- Maximum 20 segments per request.
- Source video must be accessible via URL.
- Clip URLs are temporary and expire after 1 day.`,
    },
    paths: {
      "/clip": {
        post: {
          summary: "Extract clips from a video by timestamps",
          description: `Takes a video URL and an array of time segments, extracts each segment as a separate MP4 clip, and returns public URLs for each clip.

**Workflow:**
1. Provide the source video URL and an array of segments (each with start/end in seconds).
2. FFmpeg extracts each segment using stream copy for speed.
3. Each clip is uploaded to temporary cloud storage (1-day expiry).
4. Returns an array of clip objects with URLs, labels, and durations.

**Full Path:** /nodes/video/clip`,
          tags: ["Video Utils"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: ClipRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Clips extracted successfully. Returns temporary URLs that expire after 1 day.",
              content: {
                "application/json": {
                  schema: ClipResponseSchema,
                },
              },
            },
            "400": {
              description:
                "Invalid request (e.g., invalid URL, start >= end, too many segments).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "404": {
              description: "Video not found at the provided URL.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "500": {
              description:
                "Server error during clip extraction or upload (e.g., FFmpeg error, storage issue).",
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
      tags: ["video", "clip", "trim", "ffmpeg", "extraction"],
      provider: "FFmpeg",
      category: "video",
      sourceUrl: "https://ffmpeg.org/",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/FFmpeg_Latest_logo.svg/1200px-FFmpeg_Latest_logo.svg.png",
      description:
        "Extract multiple clips from a video by timestamp ranges. Uses FFmpeg stream copy for fast extraction without re-encoding. Useful for creating highlight reels from long-form content.",
      features: [
        "Batch clip extraction (up to 20 segments)",
        "Fast stream copy (no re-encoding)",
        "Automatic GCS upload with temporary URLs",
        "Custom labels per clip",
      ],
      pricing: "Open source and free to use",
      documentation: "https://ffmpeg.org/documentation.html",
      async: true,
      complexity: "medium",
    },
  };
};
