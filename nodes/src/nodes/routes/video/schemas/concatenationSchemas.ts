import { z } from "zod";
import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";

// Video concatenation request schema
export const VideoConcatenationRequestSchema = z.object({
  videoUrls: z
    .array(z.string().url())
    .min(2)
    .refine((urls) => urls.every((url) => url.toLowerCase().endsWith(".mp4")), {
      message: "Only MP4 videos are supported",
    })
    .openapi({
      description:
        "Array of MP4 video URLs to concatenate. Must provide at least 2 videos.",
    }),
  resolutionStrategy: z.enum(["highest", "lowest"]).openapi({
    description:
      "Strategy for handling different video resolutions. 'highest' uses the highest resolution among all videos, 'lowest' uses the lowest resolution to optimize for size.",
  }),
});

// Video concatenation data schema
export const VideoConcatenationDataSchema = z.object({
  videoUrl: z.string().url().openapi({
    description: "URL of the concatenated video (temporary, expires in 1 day)",
  }),
  duration: z.number().openapi({
    description: "Duration of the concatenated video in seconds",
  }),
  width: z.number().int().openapi({
    description: "Width of the concatenated video",
  }),
  height: z.number().int().openapi({
    description: "Height of the concatenated video",
  }),
});

// Video concatenation response schema using standardized format
const VideoConcatenationResponseSchema = SuccessResponseSchema(
  VideoConcatenationDataSchema,
);

export const createOpenApiDocument = () => {
  const doc = createDocument({
    openapi: "3.0.3" as const,
    info: {
      title: "Video Concatenation API",
      version: "1.0.0",
      description: `Concatenate multiple MP4 videos into a single video file.
        Supports handling different video resolutions and aspect ratios through configurable strategies.
        Videos are processed using FFmpeg and stored in Google Cloud Storage.
        
        > **Note:** The concatenated video URL is temporary and will expire after 1 day. 
        Make sure to download the video within this timeframe.`,
    },
    paths: {
      "/concat": {
        post: {
          summary: "Concatenate multiple videos",
          description: `Combine multiple MP4 videos into a single video file. 
            The service automatically handles resolution differences based on the chosen strategy.
            Only MP4 videos are supported.
            
            **Important:** 
            - All input videos must be MP4 format
            - The returned video URL is temporary and will expire after 1 day
            - Videos with different aspect ratios will be letterboxed/pillarboxed as needed
            - Processing time increases with the number and size of input videos

            **Full Path:** /nodes/video/concat`,
          requestBody: {
            content: {
              "application/json": {
                schema: VideoConcatenationRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description:
                "Videos concatenated successfully. Returns a temporary URL that expires after 1 day.",
              content: {
                "application/json": {
                  schema: VideoConcatenationResponseSchema,
                },
              },
            },
            "400": {
              description:
                "Invalid request (e.g., unsupported video format, invalid URLs, incompatible videos)",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "404": {
              description: "One or more videos not found",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            "500": {
              description: "Server error during video concatenation",
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
      tags: ["video", "concatenation", "ffmpeg"],
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/FFmpeg_Latest_logo.svg/1200px-FFmpeg_Latest_logo.svg.png",
      sourceUrl: "https://ffmpeg.org/",
      description:
        "FFmpeg is a complete, cross-platform solution to record, convert and stream audio and video. It provides powerful tools for video manipulation, including concatenation, transcoding, and frame extraction.",
      provider: "FFmpeg",
      category: "video",
      features: [
        "Video concatenation",
        "Resolution handling",
        "Format conversion",
        "Cross-platform support",
        "High performance processing",
        "Multiple input support",
      ],
      pricing: "Open source and free to use",
      documentation: "https://ffmpeg.org/documentation.html",
      support: "https://ffmpeg.org/contact.html",
      async: true,
      complexity: "medium",
    },
  };
};
