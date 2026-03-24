import { z } from "zod";
import "zod-openapi/extend"; // Ensure openapi extension is imported
import { SuccessResponseSchema } from "../../../../types/api-response";

// Common OpenAPI tags for storage schemas
const STORAGE_TAGS = ["Storage"] as const;

// --- Request Schema ---
export const WriteContentRequestSchema = z
  .object({
    destinationSignedUrl: z
      .string()
      .url({ message: "Invalid destination signed URL provided." })
      .openapi({
        description:
          "The pre-signed URL (e.g., for PUT) to upload the content to.",
        example:
          "https://your-bucket.storage.googleapis.com/target-file.txt?X-Goog-Algorithm=...",
      }),
    content: z.string().openapi({
      description: "The string content to write/upload.",
      example: "This is the text content to be uploaded.",
    }),
    contentType: z.string().openapi({
      description:
        "Content-Type for the upload (e.g., 'text/plain'). MUST match signed URL generation.",
      example: "text/plain",
    }),
    uploadMethod: z.enum(["PUT", "POST"]).default("PUT").optional().openapi({
      description:
        "HTTP method for the destinationSignedUrl (MUST match signed URL generation, default: PUT).",
      example: "PUT",
    }),
    expectedObjectUrl: z
      .string()
      .url({ message: "Invalid expected object URL provided." })
      .optional()
      .openapi({
        description:
          "Optional: Final URL of the object after upload (returned in response if provided).",
        example: "https://your-bucket.storage.googleapis.com/target-file.txt",
      }),
  })
  .openapi({
    description:
      "Parameters for writing string content directly to a destination signed URL.",
    "x-tags": STORAGE_TAGS,
  });

// --- Response Schema ---
export const WriteContentResultDataSchema = z
  .object({
    bytesWritten: z.number().openapi({
      description: "The number of bytes successfully written.",
      example: 38, // Example based on the content example
    }),
    objectUrl: z.string().url().optional().openapi({
      description:
        "The final URL of the uploaded object (only present if 'expectedObjectUrl' was in the request).",
      example: "https://your-bucket.storage.googleapis.com/target-file.txt",
    }),
  })
  .openapi({
    description: "Details of the successful content write operation.",
    "x-tags": STORAGE_TAGS,
  });

// Combined success response schema using the standard wrapper
export const WriteContentResponseSchema = SuccessResponseSchema(
  WriteContentResultDataSchema,
).openapi({
  description: "Successful response confirming the content write operation.",
  "x-tags": STORAGE_TAGS,
});

// Infer types (optional)
export type WriteContentRequest = z.infer<typeof WriteContentRequestSchema>;
export type WriteContentResultData = z.infer<
  typeof WriteContentResultDataSchema
>;
