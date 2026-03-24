import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";
import { appConfig } from "../../../../utils/appConfig";
import { StorageService } from "../../../services/storage.service";
import {
  AudioExtractionDataSchema,
  AudioExtractionRequestSchema,
} from "../schemas/audioExtractionSchemas";
import { AudioExtractionService } from "../services/audioExtractionService";

// Infer type for request body from schema
type AudioExtractionRequest = z.infer<typeof AudioExtractionRequestSchema>;

// Initialize services
const storageService = new StorageService({
  projectId: appConfig.gcp.projectId,
  bucketName: appConfig.gcp.storage.bucketName,
});
const audioExtractor = new AudioExtractionService(storageService);

export async function extractAudioController(
  req: Request<Record<string, string>, any, AudioExtractionRequest>,
  res: Response,
) {
  try {
    const result = await audioExtractor.extractAudio(req.body);

    // Use zod schema to shape the success response
    const ResponseDataSchema = SuccessResponseSchema(AudioExtractionDataSchema);
    const responsePayload = ResponseDataSchema.parse({
      success: true,
      message: null,
      data: result,
    });

    return res.status(200).json(responsePayload);
  } catch (error: unknown) {
    console.error("[AudioExtractionController] Error extracting audio:", error);

    let statusCode = 500;
    const message =
      error instanceof Error ? error.message : "Internal server error";

    // Basic error status mapping (can be refined in the service layer ideally)
    if (error instanceof Error) {
      if (
        message.includes("Video not found") ||
        message.includes("Download failed")
      ) {
        statusCode = 404;
      }
      if (
        message.includes("Invalid input") ||
        message.includes("Only MP4 videos are supported") // Specific check
      ) {
        statusCode = 400;
      }
      // Keep 500 for generic FFmpeg or other processing errors
    }

    const errorPayload = {
      success: false,
      message: "Failed to extract audio.", // General user message
      data: null,
      error: {
        details: message, // Specific error details
      },
    };

    try {
      const parsedError = ApiErrorResponseSchema.parse(errorPayload);
      return res.status(statusCode).json(parsedError);
    } catch (parseError) {
      console.error(
        "[AudioExtractionController] Failed to parse error response:",
        parseError,
      );
      return res.status(statusCode).json(errorPayload);
    }
  }
}
