import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";
import { appConfig } from "../../../../utils/appConfig";
import { StorageService } from "../../../services/storage.service";
import { AudioConcatDataSchema, AudioConcatRequestSchema } from "../schemas/concatSchemas";
import { AudioConcatService } from "../services/concatService";

type AudioConcatRequest = z.infer<typeof AudioConcatRequestSchema>;

const storageService = new StorageService({
  projectId: appConfig.gcp.projectId,
  bucketName: appConfig.gcp.storage.bucketName,
});
const audioConcatService = new AudioConcatService(storageService);

export async function concatController(
  req: Request<Record<string, string>, any, AudioConcatRequest>,
  res: Response,
) {
  try {
    const result = await audioConcatService.concat(req.body);

    const ResponseDataSchema = SuccessResponseSchema(AudioConcatDataSchema);
    const responsePayload = ResponseDataSchema.parse({ success: true, message: null, data: result });

    return res.status(200).json(responsePayload);
  } catch (error: unknown) {
    console.error("[ConcatController] Error concatenating audio:", error);

    const message = error instanceof Error ? error.message : "Internal server error";
    const errorPayload = {
      success: false,
      message: "Failed to concatenate audio.",
      data: null,
      error: { details: message },
    };

    try {
      return res.status(500).json(ApiErrorResponseSchema.parse(errorPayload));
    } catch {
      return res.status(500).json(errorPayload);
    }
  }
}
