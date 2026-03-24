import { z } from "zod";

/**
 * Shared Cloud Storage Authentication Schemas
 * Supports both AWS S3 and Google Cloud Storage (GCS)
 */

// AWS Schemas
const AwsCredentialsSchema = z.object({
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  sessionToken: z.string().optional(),
});

const AwsAuthSchema = z.object({
  provider: z.literal("aws"),
  credentials: AwsCredentialsSchema,
  region: z.string().optional(),
});

export type AwsAuth = z.infer<typeof AwsAuthSchema>;

// GCP Schemas
const GcpCredentialsSchema = z.object({
  accessToken: z.string().optional(),
  serviceAccountKeyJson: z.string().optional(),
});

const GcpAuthSchema = z.object({
  provider: z.literal("gcp"),
  credentials: GcpCredentialsSchema,
  projectId: z.string().optional(),
});

export type GcpAuth = z.infer<typeof GcpAuthSchema>;

// Combined Cloud Storage Auth Schema
export const CloudStorageAuthSchema = z.discriminatedUnion("provider", [
  AwsAuthSchema,
  GcpAuthSchema,
]);

export type CloudStorageAuth = z.infer<typeof CloudStorageAuthSchema>;
