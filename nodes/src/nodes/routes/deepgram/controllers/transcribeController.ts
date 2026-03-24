import { Request, Response } from "express";
import { z } from "zod";
import { TranscribeUrlRequestSchema } from "../schemas/transcribeSchemas";
import * as transcribeService from "../services/transcribeService";

// Infer type from Zod schema for the validated request body
type TranscribeUrlRequest = z.infer<typeof TranscribeUrlRequestSchema>;

/**
 * Controller for the /transcribe/url endpoint.
 * Handles request validation (via middleware), calls the service,
 * and formats the response or error according to ROUTE_STANDARDS.md.
 */
export const transcribeUrlController = async (
  // Request type params: Params, ResBody, ReqBody, Query
  req: Request<
    Record<string, never>,
    any,
    TranscribeUrlRequest,
    Record<string, never>
  >,
  res: Response,
) => {
  try {
    // Input already validated by middleware, req.body has the correct type
    const validatedBody = req.body;

    // Call the service function with the validated parameters
    const resultData = await transcribeService.transcribeUrl(validatedBody);

    // Respond with the standardized success format
    // resultData already matches TranscribeResultDataSchema
    res.json({
      success: true,
      data: resultData,
    });
  } catch (error: unknown) {
    console.error("[Deepgram TranscribeUrl Controller] Error:", error);

    // Format the error response according to standards
    const message =
      error instanceof Error
        ? error.message // Use message from service/Deepgram error
        : "An unexpected error occurred during audio transcription.";

    res.status(500).json({
      success: false,
      message: "Failed to transcribe audio from URL.", // Generic user message
      error: {
        details: message,
      },
    });
  }
};
