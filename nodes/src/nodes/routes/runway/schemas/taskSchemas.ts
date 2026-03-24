import { z } from "zod";
import "zod-openapi/extend";

// Common OpenAPI tags for Runway schemas
const RUNWAY_TAGS = ["RunwayML"] as const;

// Task status enum
const TaskStatusEnum = z
  .enum(["PENDING", "THROTTLED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"])
  .openapi({
    description: "Current status of the asynchronous task",
    example: "SUCCEEDED",
    "x-tags": RUNWAY_TAGS,
  });

// Task result data schema
export const TaskResultDataSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier of the task",
      example: "task_abc123xyz789",
    }),
    status: TaskStatusEnum,
    createdAt: z.string().openapi({
      description: "Creation timestamp in ISO format",
      example: "2024-03-20T11:00:00Z",
    }),
    failure: z.string().optional().openapi({
      description: "Human-readable reason for failure, if applicable",
      example: "Input image resolution is too high",
    }),
    failureCode: z.string().optional().openapi({
      description: "Machine-readable error code, if applicable",
      example: "INVALID_INPUT_IMAGE",
    }),
    output: z
      .array(
        z.string().url().openapi({
          description: "URL to download the generated video file",
          example: "https://runway-assets.com/output/video_xyz.mp4",
        }),
      )
      .optional()
      .openapi({
        description:
          "Array of output URLs (usually one video) if task succeeded",
      }),
    progress: z.number().optional().openapi({
      description: "Progress percentage (0-1) if task is running",
      example: 0.75,
    }),
  })
  .passthrough() // Allow other fields returned by the API
  .openapi({
    description: `Task result data structure capturing the state of an asynchronous operation.
- PENDING/THROTTLED: Task is queued.
- RUNNING: Check 'progress'.
- SUCCEEDED: 'output' contains result URLs.
- FAILED: Check 'failure' and 'failureCode'.
- CANCELLED: Task was aborted.`,
    "x-tags": RUNWAY_TAGS,
  });
