import { Storage } from "@google-cloud/storage";
import { Request, Response } from "express";
import { ApiErrorResponseSchema } from "../../../../types/api-response";
import {
  GenerateGcsSignedUrlRequest,
  GenerateGcsSignedUrlResponseSchema,
} from "../schemas/signedUrlSchemas";

// Initialize GCS Storage client
// --- Quick Fix ---
// Using a hardcoded path for the service account key file.
// This is generally discouraged. For better portability and security,
// prefer using the GOOGLE_APPLICATION_CREDENTIALS environment variable
// or Application Default Credentials.
const keyFilePath =
  "/Users/jason/Documents/GitHub/nodes/functions/src/serviceAccount.json";
const storage = new Storage({
  keyFilename: keyFilePath,
});
// --- End Quick Fix ---

export async function generateSignedUrlController(
  req: Request<
    Record<string, string>,
    any,
    GenerateGcsSignedUrlRequest
  >,
  res: Response,
) {
  try {
    // Input validation is handled by middleware
    const { bucketName, fileName, contentType, method, expiresInMinutes } =
      req.body;

    // Set options for Signed URL generation (v4 is recommended)
    const expires = Date.now() + expiresInMinutes * 60 * 1000; // Expiration time in milliseconds
    const options = {
      version: "v4" as const,
      action: "write" as const,
      expires: expires,
      contentType: contentType,
      method: method,
      // Add any other options like custom headers if needed
    };

    // Generate the signed URL
    const [signedUrl] = await storage
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl(options);

    // Prepare successful response data according to schema
    const responseData = {
      signedUrl: signedUrl,
      expiresAt: new Date(expires).toISOString(),
      method: method,
      contentType: contentType,
      fileName: fileName,
      bucketName: bucketName,
    };

    // Use Zod schema to shape the success response
    const responsePayload = GenerateGcsSignedUrlResponseSchema.parse({
      success: true,
      message: "Signed URL generated successfully.",
      data: responseData,
    });

    return res.status(200).json(responsePayload);
  } catch (error: unknown) {
    console.error(
      "[SignedUrlController] Error generating GCS signed URL:",
      error,
    );

    const message =
      error instanceof Error ? error.message : "Internal server error";

    // Prepare error response data according to schema
    const errorPayload = {
      success: false,
      message: "Failed to generate signed URL.", // Keep user-facing message general
      error: {
        details: message,
        // Add an error code if applicable
      },
    };

    try {
      // Use Zod schema to shape the error response
      const parsedError = ApiErrorResponseSchema.parse(errorPayload);
      return res.status(500).json(parsedError);
    } catch (parseError) {
      console.error(
        "[SignedUrlController] Failed to parse error response:",
        parseError,
      );
      // Fallback to unparsed structure if schema parsing fails
      return res.status(500).json(errorPayload);
    }
  }
}
