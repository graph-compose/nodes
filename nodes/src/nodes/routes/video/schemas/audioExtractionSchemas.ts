import { z } from "zod";
import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";

// Audio extraction request schema
export const AudioExtractionRequestSchema = z.object({
  videoUrl: z
    .string()
    .url()
    .refine(
      (url) => {
        const ext = url.toLowerCase().split(".").pop();
        return ["mp4", "mov", "avi", "mkv", "webm"].includes(ext || "");
      },
      {
        message: "Supported video formats: MP4, MOV, AVI, MKV, WEBM",
      },
    )
    .openapi({
      description:
        "URL of the video to extract audio from. Supports MP4, MOV, AVI, MKV, WEBM formats",
    }),
  // Add optional output format if needed later (e.g., aac, wav)
  // outputFormat: z.enum(["mp3"]).default("mp3").openapi({ description: "Desired audio output format" }),
});

// Audio extraction data schema
export const AudioExtractionDataSchema = z.object({
  audioUrl: z.string().url().openapi({
    description:
      "Public URL of the extracted MP3 audio file (expires in 1 day)",
  }),
  duration: z.number().optional().openapi({
    description:
      "Approximate duration of the extracted audio in seconds (if detectable)",
  }),
  // Add other metadata if needed (e.g., original filename)
});

// Audio extraction response schema using standardized format
const AudioExtractionResponseSchema = SuccessResponseSchema(
  AudioExtractionDataSchema,
);

// Create OpenAPI document function
export const createOpenApiDocument = () => {
  const doc = createDocument({
    openapi: "3.0.3" as const,
    info: {
      title: "Video to Audio Extraction API",
      version: "1.0.0",
      description: `Extracts audio from an MP4 video file and saves it as an MP3 to cloud storage.

## Use Case
This endpoint is primarily designed as the first step in a multi-step workflow for analyzing video content.

1.  **Extract Audio:** Use this endpoint (POST /nodes/video/audio-extraction) with a video URL.
2.  **Transcribe Audio:** Take the returned \`audioUrl\` (which points to the MP3) and send it to an audio transcription endpoint (e.g., POST /nodes/openai/audio-transcription/transcribe).

This allows AI agents or workflows to process the audio content of videos.`,
    },
    paths: {
      "/audio-extraction": {
        post: {
          summary: "Extract Audio from Video (to MP3)",
          description: `Takes an MP4 video URL, extracts the audio track, encodes it as an MP3 file, uploads it to temporary cloud storage, and returns the public URL.\n\n**Workflow:**\n1. Input video URL (MP4 only).\n2. Audio is extracted and encoded using FFmpeg.\n3. MP3 file is streamed to cloud storage.\n4. A temporary public URL (expires in 1 day) to the MP3 is returned.\n\n**Intended Next Step:** Use the returned \`audioUrl\` with an audio transcription service like \`/openai/audio-transcription/transcribe\`.\n\n**Full Path:** /nodes/video/audio-extraction`,
          tags: ["Video Utils"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: AudioExtractionRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Audio extracted successfully. Returns temporary URL to MP3 file.",
              content: {
                "application/json": {
                  schema: AudioExtractionResponseSchema,
                },
              },
            },
            "400": {
              description:
                "Invalid request (e.g., non-MP4 URL, invalid URL format).",
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
                "Server error during audio extraction or upload (e.g., FFmpeg error, storage issue).",
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

  // Add metadata
  return {
    ...doc,
    meta: {
      tags: ["video", "audio-extraction", "ffmpeg"],
      provider: "FFmpeg", // Or your service name
      category: "video", // Or "audio"?
      sourceUrl: "https://ffmpeg.org/",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/FFmpeg_Latest_logo.svg/1200px-FFmpeg_Latest_logo.svg.png",
      async: true, // Processing happens server-side, could take time
      complexity: "medium",
    },
  };
};
