import { z } from "zod";
import "zod-openapi/extend"; // Ensure openapi extension is imported
import { SuccessResponseSchema } from "../../../../types/api-response";
import { appConfig } from "../../../../utils/appConfig";

// Common OpenAPI tags for storage schemas
const STORAGE_TAGS = ["Storage"] as const;

// Schema for the request body to generate a GCS signed URL
export const GenerateGcsSignedUrlRequestSchema = z
  .object({
    bucketName: z
      .string()
      .optional()
      .default(appConfig.gcp.storage.bucketName)
      .openapi({
        description: "GCS bucket name (defaults to configured bucket)",
        example: appConfig.gcp.storage.bucketName || "your-default-bucket",
      }),
    fileName: z
      .string()
      .min(1, "File name cannot be empty.")
      .refine((name) => !name.startsWith("/"), {
        message: "fileName should not start with a forward slash",
      })
      .optional()
      .default("uploads/default-upload.tmp")
      .openapi({
        description:
          "Desired object name/path within the bucket (no leading slash)",
        example: "user-uploads/document.pdf",
      }),
    contentType: z
      .string()
      .optional()
      .default("application/octet-stream")
      .openapi({
        description: "Expected Content-Type of the file to be uploaded",
        example: "application/pdf",
      }),
    method: z.enum(["PUT", "POST"]).default("PUT").openapi({
      description: "HTTP method allowed for the signed URL (PUT or POST)",
      example: "PUT",
    }),
    expiresInMinutes: z
      .number()
      .positive()
      .int()
      .max(60 * 7, "Expiration cannot exceed 7 days (10080 minutes)")
      .default(60)
      .openapi({
        description: "URL validity duration in minutes (max 10080)",
        example: 15,
      }),
  })
  .openapi({
    description: "Parameters for generating a GCS signed URL for uploads",
    "x-tags": STORAGE_TAGS,
  });

// Infer the type from the request schema
export type GenerateGcsSignedUrlRequest = z.infer<
  typeof GenerateGcsSignedUrlRequestSchema
>;

// Schema for the data part of the successful response
export const GenerateGcsSignedUrlDataSchema = z
  .object({
    signedUrl: z.string().url().openapi({
      description: "The generated signed URL for uploading the file",
      example:
        "https://storage.googleapis.com/your-bucket/user-uploads/document.pdf?X-Goog-Algorithm=...",
    }),
    expiresAt: z.string().datetime().openapi({
      description: "Timestamp (ISO 8601) when the signed URL expires",
      example: "2024-03-21T12:15:00Z",
    }),
    method: z.enum(["PUT", "POST"]).openapi({
      description: "The HTTP method specified for the upload",
      example: "PUT",
    }),
    contentType: z.string().openapi({
      description: "The Content-Type specified for the upload",
      example: "application/pdf",
    }),
    fileName: z.string().openapi({
      description: "The object name/path specified for the upload",
      example: "user-uploads/document.pdf",
    }),
    bucketName: z.string().openapi({
      description: "The target GCS bucket name",
      example: "your-default-bucket",
    }),
  })
  .openapi({
    description: "Details of the generated signed URL",
    "x-tags": STORAGE_TAGS,
  });

// Schema for the full successful response (using the common wrapper)
export const GenerateGcsSignedUrlResponseSchema = SuccessResponseSchema(
  GenerateGcsSignedUrlDataSchema,
).openapi({
  description:
    "Successful response containing the generated signed URL details",
  "x-tags": STORAGE_TAGS,
});
