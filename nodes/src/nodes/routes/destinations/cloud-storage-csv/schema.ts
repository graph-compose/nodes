import { z } from "zod";

// --- Auth Schemas (Copied from CloudStorageService - consider moving to shared types) ---
// AWS Schemas
const AwsCredentialsSchema = z.object({
  accessKeyId: z.string().openapi({ description: "AWS Access Key ID." }),
  secretAccessKey: z
    .string()
    .openapi({ description: "AWS Secret Access Key." }),
  sessionToken: z
    .string()
    .optional()
    .openapi({ description: "Optional AWS Session Token." }),
});
const AwsAuthSchema = z.object({
  provider: z.literal("aws"),
  credentials: AwsCredentialsSchema,
  region: z
    .string()
    .optional()
    .openapi({ description: "Optional AWS Region." }),
});
// GCP Schemas
const GcpCredentialsSchema = z.object({
  accessToken: z
    .string()
    .optional()
    .openapi({ description: "GCP OAuth 2.0 Access Token." }),
  serviceAccountKeyJson: z
    .string()
    .optional()
    .openapi({ description: "JSON content of GCP Service Account Key." }),
});
const GcpAuthSchema = z.object({
  provider: z.literal("gcp"),
  credentials: GcpCredentialsSchema,
  projectId: z.string().optional().openapi({ description: "GCP Project ID." }),
});
// Combined Auth Schema
export const CloudStorageAuthSchema = z
  .discriminatedUnion("provider", [AwsAuthSchema, GcpAuthSchema])
  .openapi({
    description:
      "Authentication details for Cloud Storage (AWS S3 or GCP GCS).",
  });
export type CloudStorageAuth = z.infer<typeof CloudStorageAuthSchema>;

// --- Request Schema ---
export const AppendCloudCsvRequestSchema = z
  .object({
    auth: CloudStorageAuthSchema,
    csvPath: z
      .string()
      .refine((path) => path.startsWith("s3://") || path.startsWith("gs://"), {
        message:
          "Path must start with s3://<bucket>/<key> or gs://<bucket>/<key>",
      })
      .openapi({
        description: "The full path to the target CSV file in cloud storage.",
        example: "s3://my-bucket/data/output.csv",
      }),
    data: z
      .array(z.record(z.string(), z.any()))
      .min(1)
      .openapi({
        description:
          "An array of records (objects) to append to the CSV. Must contain at least one record.",
        example: [
          { column_a: "value1", column_b: 123 },
          { column_a: "value2", column_b: 456 },
        ],
      }),
    // Optional: Add papaparse options if needed for writing (e.g., delimiter, quoteChar)
    // writeOptions: z.record(z.any()).optional().openapi({ description: "Optional papaparse configuration for writing." })
  })
  .openapi({
    description:
      "Request body for appending data to a CSV file in cloud storage.",
  });

// --- Response Schema ---
// Destinations often just return a simple success confirmation
export const AppendCloudCsvResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string().default("Data appended successfully to CSV."),
    // Optionally add details like rowsWritten, finalPath?
    // rowsWritten: z.number().optional(),
    // finalPath: z.string().optional(),
  })
  .openapi({
    description: "Confirmation of successful data append operation.",
  });

// --- OpenAPI Document ---
// Optional: Create an OpenAPI document function if this destination needs to be directly documented/discoverable
// export const createOpenApiDocument = () => { ... };
