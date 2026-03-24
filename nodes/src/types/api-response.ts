import { z } from "zod";
import "zod-openapi/extend";

// Base response schema for successful operations
export const SuccessResponseSchema = <T extends z.ZodType>(schema: T) =>
  z
    .object({
      success: z.literal(true).openapi({
        description: "Indicates successful operation",
        example: true,
      }),
      message: z.string().nullable().openapi({
        description: "Optional success message",
        example: "Operation completed successfully",
      }),
      data: schema.openapi({
        description: "Response payload containing the operation result",
      }),
    })
    .openapi({
      description: "Standard success response wrapper",
    });

// Generic error response schema - Standardized
export const ApiErrorResponseSchema = z
  .object({
    success: z.literal(false).openapi({
      description: "Indicates failed operation",
      example: false,
    }),
    message: z.string().openapi({
      description: "Human-readable error message describing the issue",
      example: "Invalid input parameters provided",
    }),
    data: z.null().openapi({
      description: "Always null for error responses",
      example: null,
    }),
    error: z
      .object({
        code: z.string().optional().openapi({
          description: "Error code for programmatic handling",
          example: "VALIDATION_ERROR",
        }),
        details: z.unknown().optional().openapi({
          description: "Additional error details or validation errors",
        }),
      })
      .optional()
      .openapi({
        description: "Optional detailed error information",
      }),
  })
  .openapi({
    "x-tags": ["API"],
    description: "Standard error response wrapper",
  });

// Type exports
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type SuccessResponse<T> = {
  success: true;
  message: string | null;
  data: T;
};
export type ErrorResponse = ApiErrorResponse;

// HTTP status code mapping for common scenarios
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
