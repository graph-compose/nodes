import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";

// Common OpenAPI tags for Kling AI schemas
const KLINGAI_TAGS = ["Kling AI"] as const;

// Basic Authentication Schema (Implicitly used, defining explicitly for clarity)
export const KlingAICredentialsSchema = z
  .object({
    accessKey: z.string().min(1).openapi({
      description: "Kling AI Access Key",
      example: "ak_abcdef1234567890",
    }),
    secretKey: z.string().min(1).openapi({
      description: "Kling AI Secret Key",
      example: "sk_fedcba0987654321",
    }),
  })
  .openapi({
    description: "Authentication credentials for Kling AI API",
    "x-tags": KLINGAI_TAGS,
  });

// Common Task Result Data Schema (used by image and video tasks)
// Base structure for task results, will be extended or refined by specific task types
export const BaseTaskResultDataSchema = z
  .object({
    task_id: z.string().openapi({
      description: "Unique identifier for the asynchronous task",
      example: "task_vid_gen_12345",
    }),
    task_status: z
      .enum(["submitted", "processing", "succeed", "failed"])
      .openapi({
        description:
          "Status: `submitted`, `processing`, `succeed`, or `failed`",
        example: "succeed",
      }),
    task_status_msg: z.string().optional().openapi({
      description:
        "Additional status info or failure reason if status is `failed`",
      example: "Generation failed due to invalid style preset.",
    }),
    created_at: z.number().int().optional().openapi({
      description: "Task creation time (Unix timestamp in milliseconds)",
      example: 1700000000000,
    }),
    updated_at: z.number().int().optional().openapi({
      description: "Task last update time (Unix timestamp in milliseconds)",
      example: 1700000120000,
    }),
    // Placeholder for actual results, to be defined in specific task schemas
    task_result: z
      .any()
      .optional()
      .openapi({
        description:
          "Contains specific results when task status is `succeed`. Structure varies.",
        example: { video_url: "https://example.com/output.mp4" }, // Generic example
      }),
  })
  .passthrough() // Allow extra fields from the API
  .openapi({
    description:
      "Core response structure for an asynchronous task. `task_result` varies.",
    "x-tags": KLINGAI_TAGS,
  });

// Generic Query Task Request Schema (used by image and various video status checks)
export const QueryTaskRequestSchema = KlingAICredentialsSchema.extend({
  task_id: z.string().openapi({
    description: "The unique identifier of the task to query status for.",
    example: "task_vid_gen_12345",
  }),
}).openapi({
  description: "Request body for querying the status of any Kling AI task.",
  "x-tags": KLINGAI_TAGS,
});

// Generic Query Task Response Schema (wraps BaseTaskResultDataSchema)
// This assumes the query endpoint returns the same base structure
export const QueryTaskResponseSchema = SuccessResponseSchema(
  BaseTaskResultDataSchema,
).openapi({
  description:
    "Standard success response containing the task status and details.",
  "x-tags": KLINGAI_TAGS,
});

// Example of a more specific task list schema (if needed later)
// export const TaskListResultDataSchema = z
//   .array(BaseTaskResultDataSchema)
//   .openapi({ description: "List of tasks and their results" });

// export const TaskListResponseSchema = SuccessResponseSchema(
//   TaskListResultDataSchema,
// );
