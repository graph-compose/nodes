import { z } from "zod";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema, // Import for use in openapi.ts
  SuccessResponseSchema,
} from "../../../../types/api-response";

// --- Reusable Field Schemas ---

const LlamaParseApiKeySchema = z.string().startsWith("llx-").openapi({
  description: "Your LlamaCloud API Key (starting with llx-).",
  example: "llx-xxxxxxxxxxxx",
});

const JobIdSchema = z.string().uuid().openapi({
  description: "The LlamaParse job ID.",
  example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
});

const ResultFormatSchema = z.enum(["text", "markdown"]).openapi({
  description: "The desired output format for the parsed content.",
  example: "markdown",
});

// Status values returned by the LlamaParse API
const LlamaParseJobStatusEnum = z.enum([
  "PENDING",
  "SUCCESS",
  "ERROR",
  "PARTIAL_SUCCESS",
  "CANCELLED",
]);

// --- Schemas for POST /create ---

export const CreateParseJobRequestSchema = z
  .object({
    apiKey: LlamaParseApiKeySchema,
    fileUrl: z.string().url().openapi({
      description: "Publicly accessible URL of the file to parse.",
      example: "https://example.com/document.pdf",
    }),
    // Include optional LlamaParse parameters explicitly if needed
    // language: z.string().optional().openapi({ ... })
    // parsingInstruction: z.string().optional().openapi({ ... })
  })
  .openapi({
    description: "Request body for POST /llamaparse/create endpoint.",
  });

const CreateParseJobResultDataSchema = z.object({
  jobId: JobIdSchema.openapi({
    description: "The ID of the parse job started on LlamaCloud.",
  }),
});

// Following naming convention: {Action}{Feature}ResponseSchema
export const CreateParseJobResponseSchema = SuccessResponseSchema(
  CreateParseJobResultDataSchema,
);

// --- Schemas for POST /status ---

// Request schema for the POST body
export const GetParseJobStatusRequestSchema = z
  .object({
    apiKey: LlamaParseApiKeySchema,
    jobId: JobIdSchema,
  })
  .openapi({
    description: "Request body for POST /llamaparse/status endpoint.",
  });

// Response data schema for job status
const GetParseJobStatusResultDataSchema = z
  .object({
    status: LlamaParseJobStatusEnum.openapi({
      description: "The current status of the LlamaParse job.",
    }),
    error: z.string().optional().openapi({
      description: "Error details, if the job status is ERROR.",
    }),
    // The API might return other fields, allow them
  })
  .passthrough() // Allow unexpected fields from the LlamaParse API
  .openapi({
    description: "Core response data containing the job status.",
  });

// Following naming convention: {Action}{Feature}ResponseSchema
export const GetParseJobStatusResponseSchema = SuccessResponseSchema(
  GetParseJobStatusResultDataSchema,
);

// --- Schemas for POST /result ---

// Request schema for the POST body
export const GetParseJobResultRequestSchema = z
  .object({
    apiKey: LlamaParseApiKeySchema,
    jobId: JobIdSchema,
    resultFormat: ResultFormatSchema.optional().default("markdown"),
  })
  .openapi({
    description: "Request body for POST /llamaparse/result endpoint.",
  });

// Response data schema for job result content
const GetParseJobResultResultDataSchema = z
  .object({
    parsedContent: z.string().openapi({
      description: "The parsed content in the requested format.",
    }),
    // The API might return other fields, allow them
  })
  .passthrough() // Allow potential extra fields in the result object
  .openapi({
    description: "Core response data containing the parsed content.",
  });

// Following naming convention: {Action}{Feature}ResponseSchema
export const GetParseJobResultResponseSchema = SuccessResponseSchema(
  GetParseJobResultResultDataSchema,
);

// Export ApiErrorResponseSchema for use in openapi.ts documentation
export { ApiErrorResponseSchema };
