import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";
import { appConfig } from "../../../../utils/appConfig";
import { StorageService } from "../../../services/storage.service";
import { ClipDataSchema, ClipRequestSchema } from "../schemas/clipSchemas";
import { ClipService } from "../services/clipService";

type ClipRequest = z.infer<typeof ClipRequestSchema>;

// Initialize services
const storageService = new StorageService({
  projectId: appConfig.gcp.projectId,
  bucketName: appConfig.gcp.storage.bucketName,
});
const clipService = new ClipService(storageService);

export async function clipController(
  req: Request<Record<string, string>, any, ClipRequest>,
  res: Response,
) {
  try {
    const result = await clipService.clipVideo(req.body);

    const ResponseDataSchema = SuccessResponseSchema(ClipDataSchema);
    const responsePayload = ResponseDataSchema.parse({
      success: true,
      message: null,
      data: result,
    });

    return res.status(200).json(responsePayload);
  } catch (error: unknown) {
    console.error("[ClipController] Error extracting clips:", error);

    let statusCode = 500;
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (error instanceof Error) {
      if (
        message.includes("Video not found") ||
        message.includes("Download failed") ||
        message.includes("404")
      ) {
        statusCode = 404;
      }
      if (
        message.includes("Invalid segment") ||
        message.includes("Invalid input")
      ) {
        statusCode = 400;
      }
    }

    const errorPayload = {
      success: false,
      message: "Failed to extract video clips.",
      data: null,
      error: {
        details: message,
      },
    };

    try {
      const parsedError = ApiErrorResponseSchema.parse(errorPayload);
      return res.status(statusCode).json(parsedError);
    } catch (parseError) {
      console.error(
        "[ClipController] Failed to parse error response:",
        parseError,
      );
      return res.status(statusCode).json(errorPayload);
    }
  }
}
