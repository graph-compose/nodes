import { Request, Response } from "express";
import { z } from "zod";
import { SpeakRequestSchema } from "../schemas/speakSchemas";
import * as speakService from "../services/speakService";

// Infer type from Zod schema for the validated request body
type SpeakRequest = z.infer<typeof SpeakRequestSchema>;

/**
 * Controller for the /speak endpoint.
 * Handles request validation (via middleware), calls the service,
 * and formats the response or error.
 */
export const speakController = async (
  // Corrected Request type parameters: Params, ResBody, ReqBody, Query
  req: Request<Record<string, never>, any, SpeakRequest, Record<string, never>>,
  res: Response,
) => {
  try {
    // Input already validated by middleware, req.body has the correct type
    const validatedBody = req.body;

    // Call the service function with the validated parameters
    const resultData = await speakService.synthesizeSpeech(validatedBody);

    // Respond with the standardized success format
    res.json({
      success: true,
      data: resultData, // resultData already matches SpeakResultDataSchema
    });
  } catch (error: unknown) {
    console.error("[Deepgram Speak Controller] Error:", error);

    // Format the error response according to standards
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during speech synthesis.";

    res.status(500).json({
      success: false,
      message: "Failed to synthesize speech.", // More generic user-facing message
      error: {
        details: message, // Include details from the service error
      },
    });
  }
};
