import { z } from "zod";
import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";

const FrameTypeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("first"),
  }),
  z.object({
    type: z.literal("last"),
  }),
  z.object({
    type: z.literal("specific"),
    timestamp: z.number().min(0),
  }),
]);

// Frame extraction request schema
export const FrameExtractionRequestSchema = z.object({
  videoUrl: z
    .string()
    .url()
    .refine((url) => url.toLowerCase().endsWith(".mp4"), {
      message: "Only MP4 videos are supported",
    })
    .openapi({ description: "URL of the MP4 video to extract frames from" }),
  frames: z.array(FrameTypeSchema).min(1).openapi({
    description:
      "Array of frame extraction specifications. Can include first frame, last frame, or specific timestamps",
  }),
  outputFormat: z
    .enum(["jpg", "png"])
    .optional()
    .default("jpg")
    .openapi({ description: "Output format of the extracted frames" }),
});

// Frame extraction data schema
export const FrameExtractionDataSchema = z.object({
  frameUrls: z
    .array(z.string().url())
    .openapi({ description: "Public URLs of the extracted frames" }),
});

// Frame extraction response schema using standardized format
const FrameExtractionResponseSchema = SuccessResponseSchema(
  FrameExtractionDataSchema,
); // Create OpenAPI document function

export const createOpenApiDocument = () => {
  const doc = createDocument({
    openapi: "3.0.3" as const,
    info: {
      title: "Frame Extraction API",
      version: "1.0.0",
      description: `Extract frames from video files at specific timestamps or positions.
        Supports extracting first frame, last frame, and frames at specific timestamps.
        Extracted frames are stored in Google Cloud Storage.`,
    },
    paths: {
      "/frame-extraction": {
        post: {
          summary: "Extract frames from video",
          description: `Extract one or more frames from a video file at specified positions.
            Frames can be extracted from the start, end, or specific timestamps.
            
            **Important:**
            - Only MP4 videos are supported
            - The returned frame URLs are temporary and will expire after 1 day
            - Frame extraction is done server-side for efficiency

            **Full Path:** /nodes/video/frame-extraction`,
          requestBody: {
            content: {
              "application/json": {
                schema: FrameExtractionRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description: "Frames extracted successfully",
              content: {
                "application/json": {
                  schema: FrameExtractionResponseSchema,
                },
              },
            },
            "400": {
              description: "Invalid request data",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
          tags: ["Video Utils"],
        },
      },
    },
  });

  return {
    ...doc,
    meta: {
      tags: ["video", "frame-extraction", "ffmpeg"],
      provider: "FFmpeg",
      category: "video",
      sourceUrl: "https://ffmpeg.org/",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/FFmpeg_Latest_logo.svg/1200px-FFmpeg_Latest_logo.svg.png",
    },
  };
};
