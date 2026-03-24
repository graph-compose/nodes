import { createDocument, ZodOpenApiObject } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  TransferRequestSchema,
  TransferResponseSchema,
} from "./schemas/transferSchemas";
import {
  WriteContentRequestSchema,
  WriteContentResponseSchema,
} from "./schemas/writeSchemas";

// Helper function to merge multiple OpenAPI documents
const mergeOpenApiDocs = (...docs: ZodOpenApiObject[]): ZodOpenApiObject => {
  const baseDoc = docs[0];
  if (!baseDoc) {
    // Handle the case where no documents are provided, perhaps return an empty structure or throw an error
    // Returning a basic structure for now
    return {
      openapi: "3.1.0",
      info: { title: "Empty API", version: "1.0.0" },
      paths: {},
      components: { schemas: {} },
    };
  }

  const mergedPaths = docs.reduce((acc, doc) => ({ ...acc, ...doc.paths }), {});
  const mergedSchemas = docs.reduce(
    (acc, doc) => ({ ...acc, ...(doc.components?.schemas || {}) }),
    {},
  );

  return {
    ...baseDoc, // Start with the base properties of the first document
    paths: mergedPaths,
    components: {
      ...baseDoc.components, // Keep other potential components from the base doc
      schemas: mergedSchemas,
      // Note: Deeper merging needed for securitySchemes, parameters, etc. if used across docs
    },
    info: baseDoc.info, // Keep info from the first doc for simplicity
  };
};

export const createOpenApiDocument = () => {
  // Define Transfer OpenAPI spec (similar to before, but paths relative to /storage)
  const transferDocPart = {
    openapi: "3.1.0",
    info: {
      title: "Transfer File via Signed URL",
      version: "1.0.0",
    },
    paths: {
      "/storage/transfer/url": {
        post: {
          summary: "Transfer file from URL to Signed URL",
          description: `Downloads a file from a public \`sourceUrl\` and uploads it to a pre-signed \`destinationSignedUrl\`. Acts as a proxy to facilitate transfers between locations without exposing credentials.

Workflow:
1. Obtain a pre-signed URL for the target destination (e.g., from \`/storage/generate-signed-url\` or another source).
2. Call this endpoint with the \`sourceUrl\` and the \`destinationSignedUrl\`.
3. Provide the correct \`contentType\` and \`uploadMethod\` that match the signed URL's requirements.
4. The service streams the download to the upload location.
5. Response indicates success or failure with details.

Important:
- \`contentType\` and \`uploadMethod\` MUST match the parameters used to generate the \`destinationSignedUrl\` exactly, otherwise the upload will likely fail with a 4xx error from the storage provider (returned as a 500 from this proxy).
- This endpoint is synchronous but involves network operations; large files may take time.`,
          tags: ["Storage"],
          requestBody: {
            required: true,
            description:
              "Source URL and destination signed URL details for the transfer",
            content: { "application/json": { schema: TransferRequestSchema } },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "File transferred successfully",
              content: {
                "application/json": { schema: TransferResponseSchema },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., malformed URLs, missing fields)",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description: "Source URL returned a 404 Not Found error.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description: `Transfer failed due to issues like download errors, upload errors (e.g., signed URL expired/invalid, permission denied), or content type mismatch.`,
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "An unexpected internal server error occurred during the transfer.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        TransferRequestSchema,
        TransferResponseSchema,
        ApiErrorResponseSchema,
      },
    },
  };

  // Define Write OpenAPI spec (similar to before, paths relative to /storage)
  const writeDocPart = {
    openapi: "3.1.0",
    info: {
      title: "Write Content via Signed URL",
      version: "1.0.0",
    },
    paths: {
      "/storage/write/content": {
        post: {
          summary: "Write string content to Signed URL",
          description: `Uploads the provided string \`content\` directly to a pre-signed \`destinationSignedUrl\`. Useful for writing small text-based files (e.g., \`CSV\`, \`JSON\`, plain text).

Workflow:
1. Obtain a pre-signed URL for the target file location.
2. Call this endpoint with the \`destinationSignedUrl\`, the string \`content\`, and the correct \`contentType\`.
3. The service performs the upload using the specified method (default \`PUT\`).
4. Response indicates success or failure.

Important:
- \`contentType\` and \`uploadMethod\` MUST match the signed URL requirements.
- Best suited for smaller text content due to potential request size limits.`,
          tags: ["Storage"],
          requestBody: {
            required: true,
            description:
              "Destination signed URL and the string content to write",
            content: {
              "application/json": { schema: WriteContentRequestSchema },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Content written successfully",
              content: {
                "application/json": { schema: WriteContentResponseSchema },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., malformed URL, missing content)",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description: `Write failed due to issues like signed URL expired/invalid, permission denied, or content type mismatch.`,
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "An unexpected internal server error occurred during the write.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        WriteContentRequestSchema,
        WriteContentResponseSchema,
        ApiErrorResponseSchema,
      },
    },
  };

  //   // Define Generate Signed URL OpenAPI spec (New)
  //   const signedUrlDocPart = {
  //     openapi: "3.1.0",
  //     info: {
  //       title: "Generate GCS Signed URL",
  //       version: "1.0.0",
  //     },
  //     paths: {
  //       "/storage/generate-signed-url": {
  //         post: {
  //           summary: "Generate GCS Signed URL for Upload",
  //           description: `Generates a v4 signed URL that allows direct file uploads to Google Cloud Storage (GCS) without exposing service account keys.

  // Workflow:
  // 1. Specify the target \`bucketName\`, \`fileName\`, and expected \`contentType\`.
  // 2. Define the allowed HTTP \`method\` (\`PUT\` or \`POST\`) for the upload.
  // 3. Set the URL \`expiresInMinutes\`.
  // 4. The service returns a \`signedUrl\` and its expiration time (\`expiresAt\`).
  // 5. Use this \`signedUrl\` with the specified method and content type to upload the file directly to GCS.

  // Security Note:
  // - Generated URLs grant temporary permission to upload to the specified object path. Handle them securely.`,
  //           tags: ["Storage"],
  //           requestBody: {
  //             required: true,
  //             description: "Parameters to configure the signed URL generation",
  //             content: {
  //               "application/json": { schema: GenerateGcsSignedUrlRequestSchema },
  //             },
  //           },
  //           responses: {
  //             [String(HTTP_STATUS.OK)]: {
  //               description: "Signed URL generated successfully",
  //               content: {
  //                 "application/json": {
  //                   schema: GenerateGcsSignedUrlResponseSchema,
  //                 },
  //               },
  //             },
  //             [String(HTTP_STATUS.BAD_REQUEST)]: {
  //               description:
  //                 "Invalid request parameters (e.g., invalid bucket/file name, expiration too long)",
  //               content: {
  //                 "application/json": { schema: ApiErrorResponseSchema },
  //               },
  //             },
  //             [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
  //               description:
  //                 "Failed to generate signed URL due to server error or GCS issue.",
  //               content: {
  //                 "application/json": { schema: ApiErrorResponseSchema },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //     components: {
  //       schemas: {
  //         GenerateGcsSignedUrlRequestSchema,
  //         GenerateGcsSignedUrlResponseSchema,
  //         ApiErrorResponseSchema,
  //       },
  //     },
  //   };

  // Merge the three parts
  const mergedDocument = mergeOpenApiDocs(
    transferDocPart as ZodOpenApiObject,
    writeDocPart as ZodOpenApiObject,
    // signedUrlDocPart as ZodOpenApiObject,
  );

  // Recreate the final document using createDocument to ensure schema components are handled
  const finalDocument = createDocument({
    ...mergedDocument,
    // Use a combined title/description
    info: {
      title: "Storage Utility API",
      version: "1.0.0",
      description: `Provides utility endpoints for common storage operations, primarily interacting with cloud storage via pre-signed URLs.

Endpoints:
- \`/storage/generate-signed-url\`: Creates a secure, temporary URL for direct uploads (specifically for GCS).
- \`/storage/transfer/url\`: Transfers a file from a public URL to a destination pre-signed URL.
- \`/storage/write/content\`: Writes string data directly to a destination pre-signed URL.

Use Cases:
- Facilitating client-side uploads without exposing credentials.
- Proxying file transfers between different locations.
- Programmatically writing small configuration or data files.`,
    },
  });

  // Add the combined meta field
  return {
    ...finalDocument,
    meta: {
      tags: [
        "storage",
        "utility",
        "proxy",
        "signed-url",
        "gcs",
        "upload",
        "transfer",
        "write",
      ],
      provider: "Utility/GCS",
      category: "Storage",
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/storage-logo.png", // GCS Logo
      sourceUrl: "https://cloud.google.com/storage", // Link to GCS docs
      description: `A set of utility functions for interacting with storage services, focusing on operations involving pre-signed URLs. Includes generating Google Cloud Storage (GCS) signed URLs for uploads, transferring files between URLs via a proxy, and writing string content directly via a signed URL.

Key Features:
- Generate GCS v4 signed URLs for uploads (\`PUT\`/\`POST\`).
- Transfer files from public URLs to signed URLs.
- Write string content directly to signed URLs.
- Acts as a secure proxy for storage interactions.

Use Cases:
- Secure client-side file uploads.
- Server-to-server file transfers.
- Writing logs or small data files programmatically.`,
      features: [
        "Generate GCS v4 Signed URLs (`PUT`/`POST`)",
        "Proxy file transfer (URL to Signed URL)",
        "Proxy string content write (String to Signed URL)",
        "Configurable expiration for signed URLs",
        "Requires exact Content-Type matching for transfers/writes",
      ],
      pricing: "Free utility node (underlying GCS costs apply)",
      documentation:
        "https://cloud.google.com/storage/docs/access-control/signed-urls",
      support: "N/A (Utility Node)",
    },
  };
};
