import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response"; // Assuming common response types
import { appConfig } from "../../../../utils/appConfig"; // Assuming appConfig is needed here
import { StorageService } from "../../../services/storage.service"; // Assuming StorageService is needed here
import {
  VideoConcatenationDataSchema,
  VideoConcatenationRequestSchema,
} from "../schemas/concatenationSchemas";
import { VideoConcatenationService } from "../services/concatenationService";

// Infer type for request body from schema
type VideoConcatenationRequest = z.infer<
  typeof VideoConcatenationRequestSchema
>;

// Initialize services (consider dependency injection if this gets complex)
const storageService = new StorageService({
  bucketName: appConfig.gcp.storage.bucketName,
  projectId: appConfig.gcp.projectId,
});
const concatenationService = new VideoConcatenationService(storageService);

export async function concatenateVideosController(
  req: Request<Record<string, string>, any, VideoConcatenationRequest>,
  res: Response,
) {
  try {
    // Validation is expected to be handled by middleware before this controller
    const result = await concatenationService.concatenateVideos(req.body);

    // Use zod schema to shape the success response
    const ResponseDataSchema = SuccessResponseSchema(
      VideoConcatenationDataSchema,
    );
    const responsePayload = ResponseDataSchema.parse({
      success: true,
      data: result,
    });

    return res.status(200).json(responsePayload);
  } catch (error: unknown) {
    console.error(
      "[ConcatenationController] Error concatenating videos:",
      error,
    );

    const message =
      error instanceof Error ? error.message : "Internal server error";

    // Standardized error response (align with ApiErrorResponseSchema if defined)
    const errorPayload = {
      success: false,
      message: "Failed to concatenate videos.", // Keep user-facing message general
      error: {
        details: message, // Include original error message in details
        // You might add an error code here if applicable
      },
    };

    // Attempt to parse with error schema if available, otherwise send raw
    try {
      const parsedError = ApiErrorResponseSchema.parse(errorPayload);
      return res.status(500).json(parsedError);
    } catch (parseError) {
      console.error(
        "[ConcatenationController] Failed to parse error response:",
        parseError,
      );
      return res.status(500).json(errorPayload); // Fallback to unparsed structure
    }
  }
}
