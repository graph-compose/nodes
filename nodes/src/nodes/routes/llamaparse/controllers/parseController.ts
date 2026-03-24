import { Request, Response } from "express";
import * as parseService from "../services/service";
import {
  cleanupTempFile, // Keep cleanup available for finally block
  downloadFile,
} from "../services/service"; // Import specific helpers if needed directly

// --- Type Imports (adjust based on refactored schemas) ---
// These will be inferred types from the Zod schemas after refactoring schema.ts
// import type { z } from 'zod';
// import {
//   CreateParseJobRequestSchema,
//   GetParseJobStatusRequestSchema, // To be created
//   GetParseJobResultRequestSchema, // To be created
// } from '../schemas/schema';

// type CreateParseJobRequest = z.infer<typeof CreateParseJobRequestSchema>;
// type GetParseJobStatusRequest = z.infer<typeof GetParseJobStatusRequestSchema>;
// type GetParseJobResultRequest = z.infer<typeof GetParseJobResultRequestSchema>;

// --- Standardized Error Handling ---
const handleError = (
  res: Response,
  error: unknown,
  operation: string, // e.g., "creating parse job", "getting job status"
  statusCode = 500,
) => {
  const defaultMessage = `Failed ${operation}`;
  console.error(`[LlamaParse Controller] Error ${operation}:`, error);
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  res.status(statusCode).json({
    success: false,
    message: `${defaultMessage}.`, // User-friendly message
    error: { details: message }, // More specific details
  });
};

// --- Controller Functions ---

/**
 * Controller for POST /create
 * Handles downloading the file, starting the parse job, and returning the jobId.
 */
export const createParseJobController = async (req: Request, res: Response) => {
  // Validation is handled by middleware, req.body is typed based on schema
  const { fileUrl, apiKey /* , other LlamaParse params */ } = req.body; // Assuming CreateParseJobRequest type
  let tempFilePath: string | null = null;

  console.log(
    `[LlamaParse Controller /create] Received request for URL: ${fileUrl}`,
  );

  try {
    tempFilePath = await downloadFile(fileUrl);
    console.log(
      `[LlamaParse Controller /create] File downloaded to: ${tempFilePath}`,
    );

    const result = await parseService.startParseJob(apiKey, tempFilePath); // Service returns { jobId: string }
    console.log(
      `[LlamaParse Controller /create] Job started with ID: ${result.jobId}`,
    );

    res.json({
      success: true,
      data: result, // Should match the SuccessResponseSchema(ParseJobResultDataSchema)
    });
  } catch (error: unknown) {
    handleError(res, error, "creating LlamaParse job");
  } finally {
    if (tempFilePath) {
      // Use the imported cleanup function
      cleanupTempFile(tempFilePath).catch((cleanupError: Error) => {
        console.error(
          `[LlamaParse Controller /create] Non-critical error cleaning up temp file ${tempFilePath}:`,
          cleanupError,
        );
      });
    }
  }
};

/**
 * Controller for POST /status
 * Handles retrieving the status of a parse job.
 */
export const getParseJobStatusController = async (
  req: Request,
  res: Response,
) => {
  // Validation handled by middleware
  const { jobId, apiKey } = req.body; // Assuming GetParseJobStatusRequest type

  console.log(
    `[LlamaParse Controller /status] Checking status for job: ${jobId}`,
  );

  try {
    const result = await parseService.getParseJobStatus(apiKey, jobId); // Service returns { status: string, error?: string }

    // Special handling for 404 potentially? The service might throw specific errors.
    // If service throws a specific "NotFound" error, we could map to 404.
    // For now, rely on service error handling mapped to 500 by default handler.

    res.json({
      success: true,
      data: result, // Should match SuccessResponseSchema(ParseJobStatusResultDataSchema)
    });
  } catch (error: unknown) {
    // Example: Check for specific error types if service throws them
    // if (error instanceof JobNotFoundError) {
    //   return handleError(res, error, "getting job status", 404);
    // }
    handleError(res, error, "getting LlamaParse job status");
  }
};

/**
 * Controller for POST /result
 * Handles retrieving the result of a completed parse job.
 */
export const getParseJobResultController = async (
  req: Request,
  res: Response,
) => {
  // Validation handled by middleware
  const { jobId, apiKey, resultFormat } = req.body; // Assuming GetParseJobResultRequest type
  const format = resultFormat || "markdown"; // Use validated/defaulted format

  console.log(
    `[LlamaParse Controller /result] Getting ${format} result for job: ${jobId}`,
  );

  try {
    // First, check status (optional but recommended)
    const statusResult = await parseService.getParseJobStatus(apiKey, jobId);
    if (statusResult.status !== "SUCCESS") {
      // Return a 400 Bad Request style error if job not ready
      return res.status(400).json({
        success: false,
        message: `Cannot retrieve result. Job status is ${statusResult.status}.`,
        error: { details: `Job ${jobId} is not yet successfully completed.` },
      });
    }

    // If status is SUCCESS, get the result
    const result = await parseService.getParseJobResult(apiKey, jobId, format); // Service returns { parsedContent: string }

    res.json({
      success: true,
      data: result, // Should match SuccessResponseSchema(ParseJobResultContentDataSchema)
    });
  } catch (error: unknown) {
    // Add potential specific error mapping (e.g., 404 if status check failed for job ID)
    return handleError(res, error, "getting LlamaParse job result");
  }
};
