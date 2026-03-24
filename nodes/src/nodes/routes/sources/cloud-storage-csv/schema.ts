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
export type CloudStorageAuth = z.infer<typeof CloudStorageAuthSchema>; // Export type for service usage

// --- Request Schema ---
export const ReadCloudCsvRequestSchema = z
  .object({
    auth: CloudStorageAuthSchema,
    csvPath: z
      .string()
      .refine((path) => path.startsWith("s3://") || path.startsWith("gs://"), {
        message:
          "Path must start with s3://<bucket>/<key> or gs://<bucket>/<key>",
      })
      .openapi({
        description: "The full path to the CSV file in cloud storage.",
        example: "s3://my-bucket/data/input.csv",
      }),
    // Optional: Add papaparse options if needed (e.g., delimiter, quoteChar)
    // parseOptions: z.record(z.any()).optional().openapi({ description: "Optional papaparse configuration.", example: { delimiter: ';' } })
  })
  .openapi({
    description: "Request body for reading a CSV file from cloud storage.",
  });

// --- Response Schema ---
// Define the structure for individual items, matching Google Sheets
const ResultItemSchema = z.object({
  id: z
    .string()
    .openapi({ description: "Identifier for the row (e.g., 'row1')." }),
  name: z
    .string()
    .openapi({ description: "The header/column name (snake_case)." }),
  value: z.any().openapi({ description: "The cell value." }), // Use z.any() or be more specific if possible
});

// Define the data structure within the success response
const ReadResultDataSchema = z.object({
  items: z.array(ResultItemSchema),
  metadata: z.object({
    total: z
      .number()
      .openapi({ description: "Total number of items (cells) returned." }),
  }),
});

// Define the overall success response structure
export const ReadCloudCsvSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: ReadResultDataSchema,
  })
  .openapi({
    description:
      "Successful response containing the parsed CSV data in the expected format.",
  });

// Define a potential error response schema (optional but good practice)
// export const ReadCloudCsvErrorResponseSchema = z.object({ ... });

// Type helper for the data part
export type ReadResultData = z.infer<typeof ReadResultDataSchema>;

// --- OpenAPI Document ---
// Optional: Create an OpenAPI document function if this source needs to be directly documented/discoverable
// export const createOpenApiDocument = () => { ... };
