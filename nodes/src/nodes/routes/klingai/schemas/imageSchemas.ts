import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";
import {
  BaseTaskResultDataSchema,
  KlingAICredentialsSchema,
} from "./sharedSchemas";

// Common OpenAPI tags for Kling AI schemas
const KLINGAI_TAGS = ["Kling AI"] as const;

// Reference image schema used in image generation requests
export const ReferenceImageSchema = z
  .object({
    url: z.string().url().openapi({
      description: "URL of the reference image",
      example: "https://example.com/reference.jpg",
    }),
    fidelity: z.number().min(0).max(1).optional().default(0.5).openapi({
      description:
        "Fidelity to reference image (0-1). Higher = more similar. Default: 0.5",
      example: 0.7,
    }),
  })
  .openapi({
    description: "Reference image configuration",
    "x-tags": KLINGAI_TAGS,
  });

// Specific Task Result for Image Generation (Extending Base)
export const ImageTaskResultSchema = z
  .object({
    images: z
      .array(
        z
          .object({
            index: z.number().int().openapi({
              description: "Image index within the batch (0-8)",
              example: 0,
            }),
            url: z.string().url().openapi({
              description:
                "URL of the generated image (temporary availability).",
              example: "https://kling-prod.kwaicdn.com/image/output/abc.png",
            }),
          })
          .passthrough(), // Allow any extra fields per image from API
      )
      .nonempty() // Ensure at least one image URL is present
      .openapi({
        description: "Array containing details of the generated image(s).",
      }),
  })
  .passthrough() // Allow other top-level fields in the result object from API
  .openapi({
    description:
      "The `task_result` structure for a successful image generation task.",
    "x-tags": KLINGAI_TAGS,
  });

// Complete Data Schema for a Successful Image Task (Merges Base Task Info with Image Results)
export const ImageTaskResultDataSchema = BaseTaskResultDataSchema.extend({
  task_status: z.literal("succeed"), // Ensure status is succeed for this structure
  task_result: ImageTaskResultSchema, // Embed the specific image results
}).openapi({
  description: "Complete data structure for a succeeded image generation task.",
  "x-tags": KLINGAI_TAGS,
});

// Response Schema for Initiating Image Generation (uses Base Task Data)
export const GenerateImageResponseSchema = SuccessResponseSchema(
  BaseTaskResultDataSchema.openapi({
    description: "Initial response after submitting image generation task.",
  }), // Use the base schema here, as results aren't available yet
).openapi({
  description: "Standard success response for initiating image generation.",
  "x-tags": KLINGAI_TAGS,
});

// Response Schema for Querying Image Task Status (might return base or specific success structure)
// We can use a union to represent the different possible states returned by the status query
export const QueryImageTaskResponseDataSchema = z
  .union([
    ImageTaskResultDataSchema, // Case where task succeeded
    BaseTaskResultDataSchema.extend({
      // Case where task failed
      task_status: z.literal("failed"),
    }),
    BaseTaskResultDataSchema.extend({
      // Case where task is processing or submitted
      task_status: z.enum(["submitted", "processing"]),
    }),
  ])
  .openapi({
    description:
      "Response data for querying image task status. Structure depends on `task_status`.",
    "x-tags": KLINGAI_TAGS,
  });

export const QueryImageTaskResponseSchema = SuccessResponseSchema(
  QueryImageTaskResponseDataSchema,
).openapi({
  description: "Standard success response containing image task status.",
  "x-tags": KLINGAI_TAGS,
});

// Generate image request schema
export const GenerateImageRequestSchema = KlingAICredentialsSchema.extend({
  model_name: z
    .enum(["kling-v1", "kling-v1-5"])
    .optional()
    .default("kling-v1")
    .openapi({
      description: "Model version: `kling-v1` (default) or `kling-v1-5`.",
      example: "kling-v1-5",
    }),
  prompt: z.string().max(500).openapi({
    description: "Positive text prompt for the desired image. Max 500 chars.",
    example:
      "A highly detailed steampunk cat operating a complex machine, vibrant colors.",
  }),
  negative_prompt: z.string().max(200).optional().openapi({
    description:
      "Negative prompt (what to avoid). Max 200 chars. Cannot use with `image`.",
    example: "blurry, low quality, text, watermark, human",
  }),
  image: z.string().optional().openapi({
    description:
      "Reference image (Base64 or URL). jpg/png, max 10MB, min 300px, aspect 1:2.5-2.5:1. Enables image-to-image.",
    example: "https://example.com/input-image.png",
  }),
  image_reference: z.enum(["subject", "face"]).optional().openapi({
    description:
      "How to use reference `image`. Required if using `kling-v1-5` with `image`. `face` needs a clear face.",
    example: "subject",
  }),
  image_fidelity: z.number().min(0).max(1).optional().default(0.5).openapi({
    description:
      "Influence of reference `image` [0, 1]. Higher = more adherence. Default: 0.5.",
    example: 0.7,
  }),
  n: z.number().int().min(1).max(9).optional().default(1).openapi({
    description: "Number of images to generate [1, 9]. Default: 1.",
    example: 4,
  }),
  aspect_ratio: z
    .enum(["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3", "21:9"])
    .optional()
    .default("16:9")
    .openapi({
      description:
        "Aspect ratio (width:height). Default: `16:9`. `21:9` requires `kling-v1-5`.",
      example: "1:1",
    }),
  callback_url: z.string().url().optional().openapi({
    description: "Optional webhook URL for task status notifications (POST).",
    example: "https://your-app.com/webhook/klingai-image",
  }),
})
  .refine(
    (data) =>
      !(
        data.model_name === "kling-v1-5" &&
        data.image &&
        !data.image_reference
      ),
    {
      message:
        "`image_reference` is required when using model `kling-v1-5` with an `image`.",
      path: ["image_reference"], // Specify the field causing the error
    },
  )
  .refine(
    (data) => !(data.model_name === "kling-v1" && data.aspect_ratio === "21:9"),
    {
      message: "Aspect ratio `21:9` is only supported by model `kling-v1-5`.",
      path: ["aspect_ratio"],
    },
  )
  .refine((data) => !(data.image && data.negative_prompt), {
    message: "`negative_prompt` cannot be used when an `image` is provided.",
    path: ["negative_prompt"],
  })
  .openapi({
    description:
      "Request body for initiating an asynchronous image generation task.",
    "x-tags": KLINGAI_TAGS,
  });
