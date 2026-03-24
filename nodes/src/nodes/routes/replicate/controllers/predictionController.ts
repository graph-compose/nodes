import { Request, Response } from "express";
import { z } from "zod"; // For type inference
import {
  CreatePredictionRequestSchema,
  GetPredictionStatusRequestSchema,
} from "../schemas/predictionSchemas"; // Updated path
import * as predictionService from "../services/predictionService"; // Updated path

// Infer types from Zod schemas
type CreatePredictionRequest = z.infer<typeof CreatePredictionRequestSchema>;
type GetPredictionStatusRequest = z.infer<
  typeof GetPredictionStatusRequestSchema
>;

// Controller to create a prediction task
export const createPredictionController = async (
  req: Request<object, object, CreatePredictionRequest>, // Use object instead of {}
  res: Response,
) => {
  try {
    // Request body is assumed valid due to middleware in router.ts
    const result = await predictionService.createPrediction(req.body);

    // Respond with the task ID in the standardized format
    res.json({
      success: true,
      data: { taskId: result.id }, // Matches CreatePredictionResponseDataSchema
    });
  } catch (error: unknown) {
    console.error("[Replicate Controller /create] Error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    // Standardized error response format
    res.status(500).json({
      success: false,
      message: "Failed to create Replicate prediction.",
      error: { details: message },
    });
  }
};

// Controller to query the status of a prediction task
export const getPredictionStatusController = async (
  req: Request<object, object, GetPredictionStatusRequest>, // Use object instead of {}
  res: Response,
) => {
  try {
    // Request body is assumed valid due to middleware in router.ts
    const result = await predictionService.getPredictionStatus(req.body);

    // Respond with the standardized task status data
    res.json({
      success: true,
      data: result, // Matches GetPredictionStatusResponseDataSchema
    });
  } catch (error: unknown) {
    // The service function handles Replicate API errors (e.g., 404) internally.
    // This catch block handles unexpected errors during the service call itself.
    console.error("[Replicate Controller /status] Error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    // Standardized error response format
    res.status(500).json({
      success: false,
      message: "Failed to get Replicate prediction status.",
      error: { details: message },
    });
  }
};
