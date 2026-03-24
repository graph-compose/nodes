import { z } from "zod";
import "zod-openapi/extend";
import { VideoGenerationInputSchema } from "./videoSchemas";

// Common OpenAPI tags for Runway schemas
const RUNWAY_TAGS = ["RunwayML"] as const;
const RUNWAY_API_VERSION = "2024-11-06"; // Ensure this is the correct version

// Define required API version header
const RequiredHeaderSchema = z
  .object({
    "x-runway-version": z.literal(RUNWAY_API_VERSION).openapi({
      description: `Required API version, must be set to ${RUNWAY_API_VERSION}`,
      example: RUNWAY_API_VERSION,
    }),
  })
  .openapi({
    description: "Required headers for the Runway API",
    "x-tags": RUNWAY_TAGS,
  });

// --- Request Schemas ---

// Schema for the body of the 'Generate Video' request
export const GenerateVideoRequestBodySchema = z
  .object({
    apiKey: z.string().openapi({
      description: "RunwayML API key for Bearer authentication",
      example: "Bearer runway_sk_xxxx",
    }),
    ...VideoGenerationInputSchema.shape,
  })
  .openapi({
    description: "Request body for initiating video generation",
    "x-tags": RUNWAY_TAGS,
  });

// Schema for the full 'Generate Video' request (headers + body)
export const GenerateVideoRequestSchema = z
  .object({
    headers: RequiredHeaderSchema,
    body: GenerateVideoRequestBodySchema,
  })
  .openapi({
    description:
      "Complete request for video generation including headers and body",
    "x-tags": RUNWAY_TAGS,
  });

// Schema for the body of 'Get Task Status' and 'Delete Task' requests
export const TaskActionRequestBodySchema = z
  .object({
    apiKey: z.string().openapi({
      description: "RunwayML API key for Bearer authentication",
      example: "Bearer runway_sk_xxxx",
    }),
  })
  .openapi({
    description: "Request body containing authentication for task actions",
    "x-tags": RUNWAY_TAGS,
  });

// Schema for the parameters (URL path) of 'Get Task Status' and 'Delete Task'
export const TaskActionParamsSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier of the asynchronous task",
      example: "task_abc123xyz789",
    }),
  })
  .openapi({
    description: "URL path parameters for task actions",
    "x-tags": RUNWAY_TAGS,
  });

// Schema for the full 'Get Task Status' request (params + body)
export const GetTaskStatusRequestSchema = z
  .object({
    params: TaskActionParamsSchema,
    body: TaskActionRequestBodySchema,
  })
  .openapi({
    description: "Complete request for getting task status",
    "x-tags": RUNWAY_TAGS,
  });

// Schema for the full 'Delete Task' request (params + body)
export const DeleteTaskRequestSchema = z
  .object({
    params: TaskActionParamsSchema,
    body: TaskActionRequestBodySchema,
  })
  .openapi({
    description: "Complete request for cancelling/deleting a task",
    "x-tags": RUNWAY_TAGS,
  });
