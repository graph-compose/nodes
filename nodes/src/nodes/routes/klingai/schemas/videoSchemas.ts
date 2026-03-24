import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";
import {
  BaseTaskResultDataSchema,
  KlingAICredentialsSchema,
} from "./sharedSchemas";

// Common OpenAPI tags for Kling AI schemas
const KLINGAI_TAGS = ["Kling AI"] as const;

// --- Camera Control Schemas ---

const CameraControlConfigSchema = z
  .object({
    horizontal: z.number().min(-10).max(10).optional().openapi({
      description:
        "Horizontal camera movement (-10 to 10). Negative: left, Positive: right.",
      example: 5,
    }),
    vertical: z.number().min(-10).max(10).optional().openapi({
      description:
        "Vertical camera movement (-10 to 10). Negative: down, Positive: up.",
      example: -3,
    }),
    pan: z.number().min(-10).max(10).optional().openapi({
      description:
        "Camera rotation around vertical axis (-10 to 10). Negative: down, Positive: up.",
      example: 0,
    }),
    tilt: z.number().min(-10).max(10).optional().openapi({
      description:
        "Camera rotation around horizontal axis (-10 to 10). Negative: left, Positive: right.",
      example: 2,
    }),
    roll: z.number().min(-10).max(10).optional().openapi({
      description:
        "Camera roll (-10 to 10). Negative: counterclockwise, Positive: clockwise.",
      example: -1,
    }),
    zoom: z.number().min(-10).max(10).optional().openapi({
      description:
        "Camera zoom (-10 to 10). Negative: narrower view (zoom in), Positive: wider view (zoom out).",
      example: 4,
    }),
  })
  .refine(
    (config) => {
      const nonZeroCount = Object.values(config).filter(
        (v) => v !== undefined && v !== 0,
      ).length;
      // Allows zero or one non-zero value when type is 'simple'
      return nonZeroCount <= 1;
    },
    {
      message:
        "When using camera control type 'simple', at most one movement parameter (horizontal, vertical, pan, tilt, roll, zoom) can be non-zero.",
    },
  )
  .openapi({
    description: "Detailed configuration for 'simple' camera control type.",
    "x-tags": KLINGAI_TAGS,
  });

const CameraControlSchema = z
  .object({
    type: z
      .enum([
        "simple",
        "down_back",
        "forward_up",
        "right_turn_forward",
        "left_turn_forward",
      ])
      .openapi({
        description:
          "Predefined camera movement type. Select one or use 'simple' with config.",
        example: "simple",
      }),
    config: CameraControlConfigSchema.optional().openapi({
      description:
        "Detailed movement configuration. Required only if type is 'simple'.",
    }),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1"])
      .optional()
      .default("16:9")
      .openapi({
        description:
          "Aspect ratio for the camera view during movement (width:height). Default: 16:9",
        example: "16:9",
      }),
  })
  .refine((control) => !(control.type === "simple" && !control.config), {
    message: "'config' is required when camera control type is 'simple'.",
    path: ["config"],
  })
  .refine(
    (control) => !(control.type && control.type !== "simple" && control.config),
    {
      message:
        "'config' should only be provided when camera control type is 'simple'.",
      path: ["config"],
    },
  )
  .openapi({
    description: "Defines camera movement behavior for video generation.",
    "x-tags": KLINGAI_TAGS,
  });

// --- Video Task Result Schemas ---

// Specific Task Result for Video Generation (Base for different video types)
export const VideoTaskResultSchema = z
  .object({
    videos: z
      .array(
        z
          .object({
            index: z.number().int().optional().openapi({
              description: "Index of the video if multiple are generated.",
            }),
            url: z.string().url().openapi({
              description:
                "URL of the generated video file. Availability might be time-limited.",
            }),
            duration: z.string().optional().openapi({
              description: "Duration of the video in seconds (as a string).",
            }),
            width: z
              .number()
              .int()
              .optional()
              .openapi({ description: "Width of the video in pixels." }),
            height: z
              .number()
              .int()
              .optional()
              .openapi({ description: "Height of the video in pixels." }),
          })
          .passthrough(), // Allow extra fields per video
      )
      .nonempty() // Expect at least one video URL
      .openapi({
        description: "Array containing details of the generated videos.",
      }),
  })
  .passthrough() // Allow other top-level fields in the result object from API
  .openapi({
    description:
      "The specific result structure for a successful video generation task.",
    "x-tags": KLINGAI_TAGS,
  });

// Complete Data Schema for a Successful Video Task (Merges Base Task Info with Video Results)
export const VideoTaskSuccessDataSchema = BaseTaskResultDataSchema.extend({
  task_status: z.literal("succeed"), // Ensure status is succeed
  task_result: VideoTaskResultSchema, // Embed the specific video results
}).openapi({
  description:
    "Complete data structure returned when any video generation task has succeeded.",
  "x-tags": KLINGAI_TAGS,
});

// Union Schema for Querying any Video Task Status
export const QueryVideoTaskResponseDataSchema = z
  .union([
    VideoTaskSuccessDataSchema, // Case: Succeeded
    BaseTaskResultDataSchema.extend({
      // Case: Failed
      task_status: z.literal("failed"),
    }),
    BaseTaskResultDataSchema.extend({
      // Case: Processing or Submitted
      task_status: z.enum(["submitted", "processing", "succeed"]),
    }),
  ])
  .openapi({
    description:
      "Response data for querying any video task status (Text-to-Video, Image-to-Video, Extension). Structure depends on the task_status.",
    "x-tags": KLINGAI_TAGS,
  });

// Generic Response Schema for Querying ANY Video Task
export const QueryVideoTaskResponseSchema = SuccessResponseSchema(
  QueryVideoTaskResponseDataSchema,
).openapi({
  description: "Standard success response containing video task status.",
  "x-tags": KLINGAI_TAGS,
});

// --- Text-to-Video Schemas ---

export const GenerateVideoFromTextRequestSchema =
  KlingAICredentialsSchema.extend({
    prompt: z.string().max(1000).openapi({
      description:
        "Text description for video generation. Max 1000 characters.",
      example:
        "A cinematic shot of a futuristic city skyline at sunset, high detail.",
    }),
    negative_prompt: z.string().max(200).optional().openapi({
      description:
        "Negative prompt (e.g., blurry, low quality). Max 200 chars.",
      example: "cartoon, drawing, sketch, blurry, low quality",
    }),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1"])
      .optional()
      .default("16:9")
      .openapi({
        description: "Aspect ratio (width:height). Default: 16:9",
        example: "16:9",
      }),
    duration: z.enum(["5s", "10s"]).optional().default("5s").openapi({
      description: "Video duration. Default: 5s",
      example: "10s",
    }),
    callback_url: z.string().url().optional().openapi({
      description:
        "Optional callback URL for task status notifications (POST).",
      example: "https://your-app.com/webhook/klingai",
    }),
  }).openapi({
    description: "Request body for generating video from text.",
    "x-tags": KLINGAI_TAGS,
  });

// Response schema for initiating Text-to-Video uses the base task result
export const GenerateVideoFromTextResponseSchema = SuccessResponseSchema(
  BaseTaskResultDataSchema.openapi({
    description: "Initial response after submitting a text-to-video task.",
  }),
).openapi({
  description: "Standard success response for initiating text-to-video.",
  "x-tags": KLINGAI_TAGS,
});

// --- Image-to-Video Schemas ---

const StaticMaskSchema = z
  .object({
    image: z.string().openapi({
      description:
        "Mask image (Base64 or URL). Black areas indicate static regions, white areas indicate motion regions. Required if using static_mask.",
    }),
  })
  .openapi({
    description: "Configuration for static mask in image-to-video.",
    "x-tags": KLINGAI_TAGS,
  });

const DynamicMaskSchema = z
  .object({
    frame_interval: z.number().int().min(1).optional().openapi({
      description:
        "Frame interval for mask application. Default determined by service.",
    }),
    frame_count: z.number().int().min(1).optional().openapi({
      description: "Number of mask frames. Default determined by service.",
    }),
    masks: z
      .array(
        z.object({
          frame_index: z
            .number()
            .int()
            .openapi({ description: "Frame index." }),
          image: z
            .string()
            .openapi({ description: "Mask image (Base64 or URL)." }),
        }),
      )
      .nonempty()
      .openapi({ description: "Array of mask images for specific frames." }),
  })
  .openapi({
    description: "Configuration for dynamic masks in image-to-video.",
    "x-tags": KLINGAI_TAGS,
  });

export const GenerateVideoFromImageRequestSchema =
  KlingAICredentialsSchema.extend({
    image: z.string().openapi({
      description:
        "Source image (Base64 or URL). Formats: jpg/jpeg/png. Max 10MB. Min 300x300px. Aspect ratio 1:2.5 to 2.5:1.",
    }),
    image_tail: z.string().optional().openapi({
      description:
        "End frame image (Base64 or URL). Same requirements as source image. Cannot be used with masks or camera_control. Only supports 5s duration.",
    }),
    static_mask: StaticMaskSchema.optional(),
    dynamic_masks: DynamicMaskSchema.optional(),
    camera_control: CameraControlSchema.optional(),
    duration: z.enum(["5s", "10s"]).optional().default("5s").openapi({
      description:
        "Video duration. Default: 5s. Note: 10s duration is not supported when using image_tail or masks.",
      example: "5s",
    }),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1"])
      .optional()
      .default("16:9")
      .openapi({
        description: "Aspect ratio (width:height). Default: 16:9",
        example: "9:16",
      }),
    callback_url: z.string().url().optional().openapi({
      description: "Callback URL for task status notifications.",
    }),
  })
    // Validation Rules from API Docs
    .refine(
      (data) =>
        !(
          data.image_tail &&
          (data.static_mask || data.dynamic_masks || data.camera_control)
        ),
      {
        message:
          "'image_tail' cannot be used simultaneously with 'static_mask', 'dynamic_masks', or 'camera_control'.",
        path: ["image_tail"],
      },
    )
    .refine(
      (data) =>
        !((data.static_mask || data.dynamic_masks) && data.camera_control),
      {
        message:
          "Masks ('static_mask', 'dynamic_masks') cannot be used simultaneously with 'camera_control'.",
        path: ["static_mask"],
      }, // Arbitrary path for combined error
    )
    .refine(
      (data) =>
        !(
          (data.image_tail || data.static_mask || data.dynamic_masks) &&
          data.duration === "10s"
        ),
      {
        message:
          "'10s' duration is not supported when using 'image_tail', 'static_mask', or 'dynamic_masks'. Only '5s' is allowed.",
        path: ["duration"],
      },
    )
    .openapi({
      description:
        "Request body for generating video from an image, with optional motion control.",
      "x-tags": KLINGAI_TAGS,
    });

// Response schema for initiating Image-to-Video
export const GenerateVideoFromImageResponseSchema = SuccessResponseSchema(
  BaseTaskResultDataSchema.openapi({
    description: "Initial response after submitting an image-to-video task.",
  }),
).openapi({
  description: "Standard success response for initiating image-to-video.",
  "x-tags": KLINGAI_TAGS,
});

// --- Video Extension Schemas ---

export const GenerateVideoExtensionRequestSchema =
  KlingAICredentialsSchema.extend({
    video_id: z.string().openapi({
      description:
        "The `id` of the video generated in a previous task (from the `videos` array in a successful result).",
      example: "b58c8446-099c-4c12-b65d-bdd6f9325c61",
    }),
    prompt: z.string().max(1000).openapi({
      description: "Text prompt guiding the extension. Max 1000 chars.",
      example: "Make the sunset more vibrant and add fireworks.",
    }),
    negative_prompt: z.string().max(200).optional().openapi({
      description: "Negative prompt. Max 200 chars.",
      example: "blurry, low resolution",
    }),
    aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional().openapi({
      description: "Output aspect ratio. If unset, inferred from input video.",
      example: "16:9",
    }),
    duration: z.enum(["5s", "10s"]).optional().default("5s").openapi({
      description: "Desired output duration. Default: `5s`.",
      example: "5s",
    }),
    callback_url: z.string().url().optional().openapi({
      description: "Optional callback URL for task status notifications.",
      example: "https://your-app.com/webhook/klingai-extension",
    }),
  }).openapi({
    description: "Request body for extending a previously generated video.",
    "x-tags": KLINGAI_TAGS,
  });

// Response schema for initiating Video Extension
export const GenerateVideoExtensionResponseSchema = SuccessResponseSchema(
  BaseTaskResultDataSchema.openapi({
    description: "Initial response after submitting a video extension task.",
  }),
).openapi({
  description: "Standard success response for initiating video extension.",
  "x-tags": KLINGAI_TAGS,
});

// Specific query response schemas (though the generic QueryVideoTaskResponseSchema covers these)
// Exporting them explicitly might be useful for documentation clarity if needed
export const QueryTextToVideoTaskResponseSchema = QueryVideoTaskResponseSchema;
export const QueryImageToVideoTaskResponseSchema = QueryVideoTaskResponseSchema;
export const QueryVideoExtensionTaskResponseSchema =
  QueryVideoTaskResponseSchema;
