import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";

// Common OpenAPI tags for Luma schemas
const LUMA_TAGS = ["Luma AI"] as const;

// Define reusable state enum with descriptions
const LumaGenerationStateEnum = z
  .enum([
    "queued",
    "submitted",
    "processing",
    "dreaming",
    "completed",
    "failed",
  ])
  .openapi({
    description: "Current state of the generation task",
    example: "completed",
    "x-tags": LUMA_TAGS,
  });

// Video generation input schema
export const VideoGenerationInputSchema = z
  .object({
    prompt: z.string().min(1).openapi({
      description: "Text prompt describing the video to generate",
      example:
        "A serene mountain landscape with snow-capped peaks at sunset, cinematic camera movement",
    }),
    negativePrompt: z.string().optional().openapi({
      description: "Text prompt describing what to avoid in the video",
      example: "shaky camera, blurry, low quality",
    }),
    seed: z.number().int().optional().openapi({
      description: "Random seed for reproducibility",
      example: 12345,
    }),
    aspect_ratio: z.string().optional().openapi({
      description: "Aspect ratio of the generated video",
      example: "16:9",
    }),
    duration: z.enum(["5s", "9s"]).optional().openapi({
      description: "Duration of the video",
      example: "5s",
    }),
    resolution: z.enum(["540p", "720p", "1080p", "4k"]).optional().openapi({
      description: "Resolution of the generated video",
      example: "1080p",
    }),
    model: z.string().optional().default("ray-2").openapi({
      description: "Model to use for generation",
      example: "ray-2",
    }),
    loop: z.boolean().optional().openapi({
      description: "Whether the video should loop",
      example: true,
    }),
    keyframes: z
      .object({
        frame0: z
          .object({
            type: z.enum(["image", "generation"]),
            url: z.string().url().optional(),
            id: z.string().optional(),
          })
          .optional(),
        frame1: z
          .object({
            type: z.enum(["image", "generation"]),
            url: z.string().url().optional(),
            id: z.string().optional(),
          })
          .optional(),
      })
      .optional()
      .openapi({
        description: "Keyframes for video generation",
        example: {
          frame0: {
            type: "image",
            url: "https://example.com/start.jpg",
          },
          frame1: {
            type: "image",
            url: "https://example.com/end.jpg",
          },
        },
      }),
  })
  .openapi({
    description: "Parameters for video generation",
    "x-tags": LUMA_TAGS,
  });

// Create video generation request schema
export const CreateVideoGenerationRequestSchema =
  VideoGenerationInputSchema.extend({
    apiKey: z.string().openapi({
      description: "Luma API key",
      example: "luma_sk_xxxx",
    }),
  }).openapi({
    description: "Complete request body for video generation",
    "x-tags": LUMA_TAGS,
  });

// Get video generation body schema
export const GetVideoGenerationBodySchema = z
  .object({
    apiKey: z.string().openapi({ description: "Luma API key" }),
  })
  .openapi({ description: "Authentication parameters for status request" });

// Get video generation status request schema
export const GetVideoGenerationParamsSchema = z
  .object({
    id: z.string().openapi({ description: "Video generation ID" }),
  })
  .openapi({ description: "Get video generation status request params" });

// List video generations body schema
export const ListVideoGenerationsBodySchema = z
  .object({
    apiKey: z.string().openapi({ description: "Luma API key" }),
  })
  .openapi({ description: "Authentication parameters for list request" });

// List video generations request schema
export const ListVideoGenerationsRequestSchema = z
  .object({
    limit: z
      .string()
      .optional()
      .openapi({ description: "Maximum number of results to return" }),
    cursor: z.string().optional().openapi({ description: "Pagination cursor" }),
  })
  .openapi({ description: "List video generations request query" });

// Video generation result data schema
export const VideoGenerationResultDataSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier for the video generation task",
      example: "gen_abc123xyz789",
    }),
    generation_type: z.string().optional().openapi({
      description: "Type of generation",
      example: "video",
    }),
    state: LumaGenerationStateEnum,
    failure_reason: z.string().nullable().optional().openapi({
      description: "Error message if generation failed",
      example: "Invalid prompt: too many tokens",
    }),
    created_at: z.string().openapi({
      description: "Creation timestamp in ISO format",
      example: "2024-03-20T10:30:00Z",
    }),
    assets: z
      .object({
        video: z.string().url().nullable().optional(),
        image: z.string().url().nullable().optional(),
        progress_video: z.string().url().nullable().optional(),
      })
      .nullable()
      .optional()
      .openapi({
        description: "Generated asset URLs",
        example: {
          video: "https://storage.luma.ai/videos/abc123.mp4",
          image: "https://storage.luma.ai/thumbnails/abc123.jpg",
          progress_video: "https://storage.luma.ai/progress/abc123.mp4",
        },
      }),
    model: z.string().optional().openapi({
      description: "Model used for generation",
      example: "ray-2",
    }),
    request: z
      .any()
      .optional()
      .openapi({
        description: "Original request parameters",
        example: {
          prompt: "Mountain landscape at sunset",
          duration: "5s",
          resolution: "1080p",
        },
      }),
  })
  .openapi({
    description: "Video generation task details and results",
    "x-tags": LUMA_TAGS,
  });

// List video generations result data schema
export const ListVideoGenerationsResultDataSchema = z
  .object({
    data: z.array(VideoGenerationResultDataSchema),
    has_more: z
      .boolean()
      .openapi({ description: "Whether there are more results available" }),
    next_cursor: z
      .string()
      .optional()
      .openapi({ description: "Cursor for pagination" }),
  })
  .openapi({ description: "List video generations result data" });

// Authentication body schema
export const AuthBodySchema = z
  .object({
    apiKey: z.string().openapi({
      description: "Luma API key for authentication",
      example: "luma_sk_xxxx",
    }),
  })
  .openapi({
    description: "Authentication parameters",
    "x-tags": LUMA_TAGS,
  });

// Status request params schema
export const StatusParamsSchema = z
  .object({
    id: z.string().openapi({
      description: "Generation task ID",
      example: "gen_abc123xyz789",
    }),
  })
  .openapi({
    description: "Parameters for status check requests",
    "x-tags": LUMA_TAGS,
  });

// Response schemas with standard wrapper
export const VideoGenerationResponseSchema = SuccessResponseSchema(
  VideoGenerationResultDataSchema,
).openapi({
  description: "Successful video generation response",
  "x-tags": LUMA_TAGS,
});

// Export types
export type VideoGenerationInput = z.infer<typeof VideoGenerationInputSchema>;
export type VideoGenerationResult = z.infer<
  typeof VideoGenerationResultDataSchema
>;

// Image generation input schema
export const ImageGenerationInputSchema = z
  .object({
    prompt: z.string().min(1).openapi({
      description: "Text prompt describing the image to generate",
      example:
        "A photorealistic image of an astronaut riding a horse on the moon",
    }),
    aspect_ratio: z
      .enum(["1:1", "3:4", "4:3", "9:16", "16:9", "9:21", "21:9"])
      .optional()
      .default("16:9")
      .openapi({
        description: "Aspect ratio of the generated image",
        example: "16:9",
      }),
    model: z
      .enum(["photon-1", "photon-flash-1"])
      .optional()
      .default("photon-1")
      .openapi({
        description: "Model to use for image generation",
        example: "photon-1",
      }),
    image_ref: z
      .array(
        z.object({
          url: z.string().url().openapi({
            description: "URL of reference image",
            example: "https://example.com/ref1.jpg",
          }),
          weight: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .default(0.85)
            .openapi({ description: "Influence weight (0-1)", example: 0.8 }),
        }),
      )
      .max(4) // Max 4 image refs
      .optional()
      .openapi({
        description: "Reference images to guide generation (max 4).",
      }),
    style_ref: z
      .array(
        z.object({
          url: z.string().url().openapi({
            description: "URL of style reference image",
            example: "https://example.com/style.jpg",
          }),
          weight: z.number().min(0).max(1).optional().default(0.8).openapi({
            description: "Style influence weight (0-1)",
            example: 0.7,
          }),
        }),
      )
      .max(1) // Max 1 style ref
      .optional()
      .openapi({
        description:
          "Style reference image to influence the generation style (max 1).",
      }),
    character_ref: z
      .object({
        identity0: z.object({
          images: z
            .array(z.string().url())
            .min(1)
            .max(4)
            .openapi({
              description: "URLs of character reference images (1-4 required)",
              example: [
                "https://example.com/char1.jpg",
                "https://example.com/char2.jpg",
              ],
            }),
        }),
      })
      .optional()
      .openapi({
        description:
          "Character reference images for consistent character generation.",
      }),
    modify_image_ref: z
      .object({
        url: z.string().url().openapi({
          description: "URL of image to modify",
          example: "https://example.com/modify-me.jpg",
        }),
        weight: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .default(1.0)
          .openapi({ description: "Modification weight (0-1)", example: 0.9 }),
      })
      .optional()
      .openapi({
        description: "Reference image to modify with the prompt.",
      }),
    callback_url: z.string().url().optional().openapi({
      description: "Webhook URL for generation status updates.",
      example: "https://your-service.com/webhook/luma-image-status",
    }),
  })
  .openapi({
    description: "Parameters for image generation",
    "x-tags": LUMA_TAGS,
  });

// Create image generation request schema
export const CreateImageGenerationRequestSchema =
  ImageGenerationInputSchema.extend({
    apiKey: z.string().openapi({
      description: "Luma API key",
      example: "luma_sk_xxxx",
    }),
  }).openapi({
    description: "Complete request body for image generation",
    "x-tags": LUMA_TAGS,
  });

// Get image generation body schema
export const GetImageGenerationBodySchema = z
  .object({
    apiKey: z.string().openapi({
      description: "Luma API key for authentication",
      example: "luma_sk_xxxx",
    }),
  })
  .openapi({
    description: "Authentication parameters for image status request",
    "x-tags": LUMA_TAGS,
  });

// Get image generation status request schema
export const GetImageGenerationParamsSchema = z
  .object({
    id: z.string().openapi({
      description: "Image generation task ID",
      example: "img_abc123xyz789",
    }),
  })
  .openapi({
    description: "Get image generation status request params",
    "x-tags": LUMA_TAGS,
  });

// List image generations body schema
export const ListImageGenerationsBodySchema = z
  .object({
    apiKey: z.string().openapi({
      description: "Luma API key for authentication",
      example: "luma_sk_xxxx",
    }),
  })
  .openapi({
    description: "Authentication parameters for list images request",
    "x-tags": LUMA_TAGS,
  });

// List image generations request schema
export const ListImageGenerationsRequestSchema = z
  .object({
    limit: z.string().optional().openapi({
      description: "Maximum number of results to return",
      example: "20",
    }),
    cursor: z.string().optional().openapi({
      description: "Pagination cursor for fetching next page",
      example: "cursor_next_page_token",
    }),
  })
  .openapi({
    description: "Query parameters for listing image generations",
    "x-tags": LUMA_TAGS,
  });

// Image generation result data schema
export const ImageGenerationResultDataSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier for the image generation task",
      example: "img_abc123xyz789",
    }),
    type: z.literal("image").openapi({
      description: "Type of generation",
      example: "image",
    }),
    state: LumaGenerationStateEnum, // Reuses the tagged enum
    failure_reason: z.string().nullable().optional().openapi({
      description: "Error message if generation failed",
      example: "Content policy violation detected",
    }),
    created_at: z.string().openapi({
      description: "Creation timestamp in ISO format",
      example: "2024-03-20T12:00:00Z",
    }),
    assets: z
      .object({
        image: z.string().url().nullable().optional().openapi({
          description:
            "URL of the generated image (available when status is succeed)",
          example: "https://storage.luma.ai/images/img_abc123.png",
        }),
      })
      .nullable()
      .optional()
      .openapi({ description: "Generated assets, primarily the image URL" }),
    request: z
      .any()
      .optional()
      .openapi({
        description: "Original request parameters",
        example: { prompt: "Astronaut riding horse", aspect_ratio: "16:9" },
      }),
  })
  .openapi({
    description: "Image generation task details and results",
    "x-tags": LUMA_TAGS,
  });

// List image generations result data schema
export const ListImageGenerationsResultDataSchema = z
  .object({
    data: z.array(ImageGenerationResultDataSchema),
    has_more: z.boolean().openapi({
      description: "Indicates if more results are available for pagination",
      example: true,
    }),
    next_cursor: z.string().optional().openapi({
      description: "Cursor token to fetch the next page of results",
      example: "cursor_next_page_token_abc",
    }),
  })
  .openapi({
    description: "Response data structure for listing image generations",
    "x-tags": LUMA_TAGS,
  });

// Image response schema (defined here for completeness)
export const ImageGenerationResponseSchema = SuccessResponseSchema(
  ImageGenerationResultDataSchema,
).openapi({
  description: "Successful image generation response",
  "x-tags": LUMA_TAGS,
});
