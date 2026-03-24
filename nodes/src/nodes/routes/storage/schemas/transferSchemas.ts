import { z } from "zod";
import "zod-openapi/extend"; // Ensure openapi extension is imported
import { SuccessResponseSchema } from "../../../../types/api-response";

// Common OpenAPI tags for storage schemas
const STORAGE_TAGS = ["Storage"] as const;

// Schema for the request body
export const TransferRequestSchema = z
  .object({
    sourceUrl: z
      .string()
      .url({ message: "Invalid source URL provided." })
      .openapi({
        description: "The public URL of the file to download and re-upload.",
        example: "https://example.com/path/to/your/file.mp4",
      }),
    destinationSignedUrl: z
      .string()
      .url({ message: "Invalid destination signed URL provided." })
      .openapi({
        description:
          "The pre-signed URL (e.g., for PUT) to upload the file to.",
        example:
          "https://your-bucket.storage.googleapis.com/target-file.mp4?X-Goog-Algorithm=...",
      }),
    uploadMethod: z.enum(["PUT", "POST"]).default("PUT").openapi({
      description:
        "HTTP method for the destinationSignedUrl (MUST match signed URL generation, default: PUT)",
      example: "PUT",
    }),
    contentType: z.string().openapi({
      description:
        "Content-Type for the upload (MUST match signed URL generation)",
      example: "video/mp4",
    }),
  })
  .openapi({
    description:
      "Parameters for transferring a file from a source URL to a destination signed URL.",
    "x-tags": STORAGE_TAGS,
  });

// Schema for the successful response data
export const TransferResultDataSchema = z
  .object({
    bytesTransferred: z.number().openapi({
      description: "The number of bytes successfully downloaded and uploaded.",
      example: 10485760, // Example: 10 MB
    }),
  })
  .openapi({
    description: "Details of the successful file transfer.",
    "x-tags": STORAGE_TAGS,
  });

// Combined success response schema using the standard wrapper
export const TransferResponseSchema = SuccessResponseSchema(
  TransferResultDataSchema,
).openapi({
  description: "Successful response confirming the file transfer.",
  "x-tags": STORAGE_TAGS,
});

// Infer types (optional)
export type TransferRequest = z.infer<typeof TransferRequestSchema>;
export type TransferResultData = z.infer<typeof TransferResultDataSchema>;
