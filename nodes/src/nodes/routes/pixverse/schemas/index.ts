import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../elevenlabs/schemas/elevenlabsSchemas";

// --- Reusable Schemas ---

// Common OpenAPI tags for PixVerse schemas
const PIXVERSE_TAGS = ["PixVerse"] as const;

// Schema for authentication details required by our node's endpoints
export const PixverseAuthSchema = z
  .object({
    apiKey: z.string().min(1).openapi({
      description:
        "Your PixVerse API Key (obtained from PixVerse platform website).",
      example: "pv_xxxx_your_api_key_xxxx",
    }),
  })
  .openapi({
    description: "Authentication using a PixVerse API key",
    "x-tags": PIXVERSE_TAGS,
  });

// Base schema for common video generation parameters
const BaseVideoGenerationParamsSchema = z
  .object({
    prompt: z.string().max(2048).openapi({
      description:
        "Text description of the video/effect/transition (max 2048 chars).",
      example: "A majestic dragon flying through clouds, cinematic lighting.",
    }),
    negative_prompt: z.string().max(2048).optional().openapi({
      description: "Elements to exclude from the video (max 2048 chars).",
      example: "blurry, low quality, text, words, watermark",
    }),
    aspect_ratio: z.enum(["16:9", "4:3", "1:1", "3:4", "9:16"]).openapi({
      description: "Aspect ratio of the video.",
      example: "16:9",
    }),
    model: z.string().default("v3.5").openapi({
      description: "The PixVerse model to use (e.g., `v3.5`).",
      example: "v3.5",
    }),
    style: z
      .enum(["anime", "3d_animation", "day", "cyberpunk", "comic"])
      .optional()
      .openapi({
        description: "Optional: Artistic style for the video.",
        example: "anime",
      }),
    motion_mode: z
      .enum(["normal", "fast"])
      .optional()
      .default("normal")
      .openapi({
        description:
          "Camera motion mode. `fast` only supports 5s duration and not 1080p. Default: `normal`.",
        example: "normal",
      }),
    duration: z.union([z.literal(5), z.literal(8)]).openapi({
      description:
        "Duration in seconds (5 or 8). `8s` incompatible with `1080p`.",
      example: 5,
    }),
    quality: z.enum(["360p", "540p", "720p", "1080p"]).openapi({
      description:
        "Resolution. `360p` uses Turbo model. `1080p` has duration/motion restrictions.",
      example: "720p",
    }),
    seed: z.number().int().min(0).max(2147483647).optional().openapi({
      description: "Seed for randomization (0 to 2147483647).",
      example: 123456789,
    }),
    template_id: z.number().int().optional().openapi({
      description:
        "Optional: ID of a pre-defined effect template (must be activated). Only for Text/Image-to-Video.",
      example: 123,
    }),
    water_mark: z.boolean().optional().default(false).openapi({
      description: "Whether to add a PixVerse watermark. Default: false.",
      example: false,
    }),
  })
  .openapi({
    description: "Common parameters shared across video generation requests",
    "x-tags": PIXVERSE_TAGS,
  });

// --- Image Upload Schemas ---

// Request schema for uploading an image file directly (requires multipart)
export const UploadImageRequestSchema = PixverseAuthSchema.extend({}).openapi({
  description:
    "Request body for `POST /nodes/pixverse/image/upload` (requires `multipart/form-data`). Include `apiKey` and `img` file field.",
  "x-tags": PIXVERSE_TAGS,
});

// Schema for uploading an image via URL
export const UploadImageFromUrlRequestSchema = PixverseAuthSchema.extend({
  imageUrl: z.string().url().openapi({
    description:
      "The public URL of the image to download and upload to PixVerse.",
    example: "https://example.com/character.png",
  }),
}).openapi({
  description:
    "Request body for `POST /nodes/pixverse/image/upload_from_url` (JSON).",
  "x-tags": PIXVERSE_TAGS,
});

// Response data schema for successful image upload
export const UploadImageResponseDataSchema = z
  .object({
    imgId: z.number().int().openapi({
      description:
        "The unique identifier for the uploaded image, used in subsequent video generation requests.",
      example: 987654321,
    }),
  })
  .openapi({
    description: "Core data containing the PixVerse image ID",
    "x-tags": PIXVERSE_TAGS,
  });
export const UploadImageResponseSchema = SuccessResponseSchema(
  UploadImageResponseDataSchema,
).openapi({
  description: "Standard success response for image upload.",
  "x-tags": PIXVERSE_TAGS,
});

// --- Text-to-Video Schemas ---

export const CreateTextToVideoRequestSchema = PixverseAuthSchema.merge(
  BaseVideoGenerationParamsSchema,
).openapi({
  description: "Request body for initiating a text-to-video task.",
  "x-tags": PIXVERSE_TAGS,
});

// Response data schema for task creation (reusable)
export const PixverseTaskCreateResponseDataSchema = z
  .object({
    videoId: z.number().int().openapi({
      description:
        "The unique ID for the initiated video task. Use this ID to query status.",
      example: 12345678,
    }),
  })
  .openapi({
    description: "Core data containing the ID of the initiated PixVerse task",
    "x-tags": PIXVERSE_TAGS,
  });
export const CreateVideoResponseSchema = SuccessResponseSchema(
  PixverseTaskCreateResponseDataSchema,
).openapi({
  description: "Standard success response after initiating any video task.",
  "x-tags": PIXVERSE_TAGS,
});

// --- Image-to-Video Schemas ---

export const CreateImageToVideoRequestSchema = PixverseAuthSchema.merge(
  BaseVideoGenerationParamsSchema,
)
  .extend({
    img_id: z.number().int().openapi({
      description:
        "ID of the image previously uploaded via `/image/upload` or `/image/upload_from_url`.",
      example: 987654321,
    }),
  })
  .openapi({
    description: "Request body for initiating an image-to-video task.",
    "x-tags": PIXVERSE_TAGS,
  });

// --- Transition Schemas ---

export const CreateTransitionRequestSchema = PixverseAuthSchema.merge(
  BaseVideoGenerationParamsSchema,
)
  .extend({
    first_frame_img: z.number().int().openapi({
      description:
        "ID of the image for the starting frame (previously uploaded).",
      example: 987654321,
    }),
    last_frame_img: z.number().int().openapi({
      description:
        "ID of the image for the ending frame (previously uploaded).",
      example: 112233445,
    }),
  })
  .omit({ style: true, template_id: true }) // Style and template_id not applicable to transitions per docs
  .openapi({
    description:
      "Request body for initiating a video transition task between two images.",
    "x-tags": PIXVERSE_TAGS,
  });

// --- Task Status Schemas ---

export const QueryTaskRequestSchema = PixverseAuthSchema.extend({
  videoId: z.number().int().openapi({
    description: "ID of the PixVerse task (from create response) to query.",
    example: 12345678,
  }),
}).openapi({
  description: "Request body for querying the status of a PixVerse task.",
  "x-tags": PIXVERSE_TAGS,
});

// Enum for PixVerse status codes mapped to our standard terms
export const PixverseTaskStatusEnum = z
  .enum([
    "processing", // PixVerse status 5
    "succeed", // PixVerse status 1
    "moderation_failed", // PixVerse status 7
    "failed", // PixVerse status 8
  ])
  .openapi({
    description: "Current status of the video generation task",
    example: "succeed",
    "x-tags": PIXVERSE_TAGS,
  });

// Response data schema for task status query
export const PixverseTaskResultDataSchema = z
  .object({
    videoId: z.number().int().openapi({
      description: "The unique identifier for the PixVerse task.",
      example: 12345678,
    }),
    status: PixverseTaskStatusEnum, // Use tagged enum
    prompt: z.string().optional().openapi({
      description: "Original text prompt used (if applicable).",
      example: "City sunset timelapse",
    }),
    negative_prompt: z.string().optional().openapi({
      description: "Negative prompt used (if applicable).",
      example: "blurry, low quality",
    }),
    style: z.string().optional().openapi({
      description: "Artistic style used (if applicable).",
      example: "anime",
    }),
    seed: z.number().int().optional().openapi({
      description: "Random seed used for generation.",
      example: 123456789,
    }),
    outputWidth: z.number().int().optional().openapi({
      description: "Width of the output video in pixels.",
      example: 1280,
    }),
    outputHeight: z.number().int().optional().openapi({
      description: "Height of the output video in pixels.",
      example: 720,
    }),
    size: z.number().int().optional().openapi({
      description: "Size of the generated video file in bytes.",
      example: 8427520,
    }),
    create_time: z.string().datetime().optional().openapi({
      description: "Task creation timestamp (ISO 8601).",
      example: "2025-03-25T08:30:00Z",
    }),
    modify_time: z.string().datetime().optional().openapi({
      description: "Task last modification timestamp (ISO 8601).",
      example: "2025-03-25T08:35:12Z",
    }),
    url: z.string().url().optional().openapi({
      description:
        "URL of the generated video (available only when status is `succeed`).",
      example: "https://videos.pixverse.ai/generated/abc.mp4", // Example URL
    }),
  })
  .passthrough() // Allow any other fields from PixVerse status response
  .openapi({
    description:
      "Response data containing the PixVerse task status and results.",
    "x-tags": PIXVERSE_TAGS,
  });

export const QueryTaskResponseSchema = SuccessResponseSchema(
  PixverseTaskResultDataSchema,
).openapi({
  description: "Standard success response for the task status query.",
  "x-tags": PIXVERSE_TAGS,
});

// --- Type Exports (Optional but good practice) ---
export type CreateTextToVideoRequest = z.infer<
  typeof CreateTextToVideoRequestSchema
>;
export type CreateTextToVideoResponse = z.infer<
  typeof CreateVideoResponseSchema
>;
export type QueryTaskRequest = z.infer<typeof QueryTaskRequestSchema>;
export type QueryTaskResponse = z.infer<typeof QueryTaskResponseSchema>;
export type PixverseTaskResultData = z.infer<
  typeof PixverseTaskResultDataSchema
>;
export type UploadImageRequest = z.infer<typeof UploadImageRequestSchema>;
export type UploadImageResponse = z.infer<typeof UploadImageResponseSchema>;
export type CreateImageToVideoRequest = z.infer<
  typeof CreateImageToVideoRequestSchema
>;
export type CreateTransitionRequest = z.infer<
  typeof CreateTransitionRequestSchema
>;
