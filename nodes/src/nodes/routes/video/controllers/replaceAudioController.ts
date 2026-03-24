import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";
import { appConfig } from "../../../../utils/appConfig";
import { StorageService } from "../../../services/storage.service";
import { ReplaceAudioDataSchema, ReplaceAudioRequestSchema } from "../schemas/replaceAudioSchemas";
import { ReplaceAudioService } from "../services/replaceAudioService";

type ReplaceAudioRequest = z.infer<typeof ReplaceAudioRequestSchema>;

const storageService = new StorageService({
  projectId: appConfig.gcp.projectId,
  bucketName: appConfig.gcp.storage.bucketName,
});
const replaceAudioService = new ReplaceAudioService(storageService);

export async function replaceAudioController(
  req: Request<Record<string, string>, any, ReplaceAudioRequest>,
  res: Response,
) {
  try {
    const result = await replaceAudioService.replaceAudio(req.body);

    const ResponseDataSchema = SuccessResponseSchema(ReplaceAudioDataSchema);
    const responsePayload = ResponseDataSchema.parse({
      success: true,
      message: null,
      data: result,
    });

    return res.status(200).json(responsePayload);
  } catch (error: unknown) {
    console.error("[ReplaceAudioController] Error replacing audio:", error);

    let statusCode = 500;
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (error instanceof Error) {
      if (
        message.includes("not found") ||
        message.includes("Download failed") ||
        message.includes("404")
      ) {
        statusCode = 404;
      }
      if (message.includes("Invalid input")) {
        statusCode = 400;
      }
    }

    const errorPayload = {
      success: false,
      message: "Failed to replace video audio.",
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
        "[ReplaceAudioController] Failed to parse error response:",
        parseError,
      );
      return res.status(statusCode).json(errorPayload);
    }
  }
}
