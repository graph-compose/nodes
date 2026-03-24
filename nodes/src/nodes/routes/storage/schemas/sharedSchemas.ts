import { z } from "zod";
import "zod-openapi/extend";

// Common OpenAPI tags for storage schemas
const STORAGE_TAGS = ["Storage"] as const;

// Shared base schema for success responses
export const BaseSuccessResponseSchema = z
  .object({
    success: z.literal(true).openapi({
      description: "Indicates successful operation",
      example: true,
    }),
    message: z.string().openapi({
      description: "Confirmation message for the successful operation",
      example: "Operation completed successfully.",
    }),
  })
  .openapi({
    description:
      "Basic success response structure, often extended with specific data",
    "x-tags": STORAGE_TAGS,
  });
