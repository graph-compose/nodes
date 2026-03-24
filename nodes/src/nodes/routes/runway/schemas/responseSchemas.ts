import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response"; // Corrected relative path
import { TaskResultDataSchema } from "./taskSchemas";
import { VideoGenerationResultDataSchema } from "./videoSchemas";

// Common OpenAPI tags for Runway schemas
const RUNWAY_TAGS = ["RunwayML"] as const;

// --- Response Schemas ---

// Response for successful video generation initiation
export const GenerateVideoResponseSchema = SuccessResponseSchema(
  VideoGenerationResultDataSchema,
).openapi({
  description:
    "Response after successfully initiating video generation, containing the task ID.",
  "x-tags": RUNWAY_TAGS,
});

// Response for successful task status retrieval
export const GetTaskStatusResponseSchema = SuccessResponseSchema(
  TaskResultDataSchema,
).openapi({
  description: "Response containing the details and status of a specific task.",
  "x-tags": RUNWAY_TAGS,
});

// No specific success response schema needed for delete (usually 204 No Content)

// General error response schema (re-exported for clarity)
export const RunwayApiErrorResponseSchema = ApiErrorResponseSchema.openapi({
  description: "Standard error response format for Runway node API failures.",
  "x-tags": RUNWAY_TAGS,
});
