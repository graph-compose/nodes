import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";
import { appConfig } from "../../../../utils/appConfig";
import { StorageService } from "../../../services/storage.service";
import {
  FrameExtractionDataSchema,
  FrameExtractionRequestSchema,
} from "../schemas/frameExtractionSchemas";
import { FrameExtractorService } from "../services/frameExtractionService";

// Infer type for request body from schema
type FrameExtractionRequest = z.infer<typeof FrameExtractionRequestSchema>;

// Initialize services
const storageService = new StorageService({
  projectId: appConfig.gcp.projectId,
  bucketName: appConfig.gcp.storage.bucketName,
});
const frameExtractor = new FrameExtractorService(storageService);

export async function extractFramesController(
  req: Request<Record<string, string>, any, FrameExtractionRequest>,
  res: Response,
) {
  try {
    const result = await frameExtractor.extractFrames(req.body);

    // Use zod schema to shape the success response
    // Assuming FrameExtractionDataSchema expects { frameUrls: string[] }
    const ResponseDataSchema = SuccessResponseSchema(FrameExtractionDataSchema);
    const responsePayload = ResponseDataSchema.parse({
      success: true,
      data: { frameUrls: result }, // Adapt if service returns object directly
    });

    return res.status(200).json(responsePayload);
  } catch (error: unknown) {
    console.error(
      "[FrameExtractionController] Error extracting frames:",
      error,
    );

    const message =
      error instanceof Error ? error.message : "Internal server error";

    const errorPayload = {
      success: false,
      message: "Failed to extract frames.", // General user message
      error: {
        details: message, // Specific error details
      },
    };

    try {
      const parsedError = ApiErrorResponseSchema.parse(errorPayload);
      return res.status(500).json(parsedError);
    } catch (parseError) {
      console.error(
        "[FrameExtractionController] Failed to parse error response:",
        parseError,
      );
      return res.status(500).json(errorPayload);
    }
  }
}
