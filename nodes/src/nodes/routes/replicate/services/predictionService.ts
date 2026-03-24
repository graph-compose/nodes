import Replicate from "replicate";
import { z } from "zod";
import {
  CreatePredictionRequestSchema,
  GetPredictionStatusRequestSchema,
  GetPredictionStatusResponseDataSchema,
} from "../schemas/predictionSchemas";
import { ReplicatePrediction } from "../schemas/types";

// --- Helper Functions ---

/**
 * Maps Replicate prediction status to our internal standardized status.
 */
const mapReplicateStatus = (
  replicateStatus: ReplicatePrediction["status"],
): z.infer<typeof GetPredictionStatusResponseDataSchema>["status"] => {
  switch (replicateStatus) {
    case "starting":
      return "submitted"; // Map starting to submitted
    case "processing":
      return "processing";
    case "succeeded":
      return "succeed";
    case "failed":
    case "canceled":
      return "failed"; // Map canceled to failed as well
    default:
      console.warn(
        `[Replicate Service] Unknown status received: ${replicateStatus}`,
      );
      return "failed";
  }
};

/**
 * Handles errors from the Replicate SDK.
 */
const handleReplicateError = (error: unknown, context: string) => {
  // The Replicate SDK might throw specific error types, but catching general Error is safer
  if (error instanceof Error) {
    console.error(
      `[Replicate Service - ${context}] API Error:`,
      error.message,
      error,
    );
    // Attempt to extract status code if it's an API error-like structure
    const statusMatch = error.message.match(/status code (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : 500;
    throw new Error(
      `Replicate API Error (${context}): ${error.message} (Status: ${status})`,
    );
  } else {
    console.error(`[Replicate Service - ${context}] Unknown error:`, error);
    throw new Error(
      `An unexpected error occurred in Replicate Service (${context}).`,
    );
  }
};

// --- API Service Functions ---

/**
 * Creates a Replicate prediction task.
 */
export const createPrediction = async (
  params: z.infer<typeof CreatePredictionRequestSchema>,
): Promise<{ id: string }> => {
  const { apiKey, version, input, webhook, webhook_events_filter } = params;
  const replicate = new Replicate({ auth: apiKey });

  try {
    const prediction = await replicate.predictions.create({
      version: version,
      input: input,
      webhook: webhook, // Pass through if provided
      webhook_events_filter: webhook_events_filter, // Pass through if provided
    });

    if (!prediction || !prediction.id) {
      throw new Error(
        "Failed to create prediction: No ID returned from Replicate.",
      );
    }
    console.log("[Replicate Service] Prediction created:", prediction.id);
    return { id: prediction.id };
  } catch (error) {
    handleReplicateError(error, "createPrediction");
    throw error; // Re-throw after logging
  }
};

/**
 * Queries the status of a Replicate prediction.
 */
export const getPredictionStatus = async (
  params: z.infer<typeof GetPredictionStatusRequestSchema>,
): Promise<z.infer<typeof GetPredictionStatusResponseDataSchema>> => {
  const { apiKey, taskId } = params;
  const replicate = new Replicate({ auth: apiKey });

  try {
    const prediction: ReplicatePrediction = await replicate.predictions.get(
      taskId,
    );
    console.log(
      "[Replicate Service] Prediction status received:",
      prediction.id,
      prediction.status,
    );

    // Destructure conflicting/mapped fields
    const {
      id,
      status: originalStatus,
      input: originalInput,
      output: originalOutput,
      error: originalError,
      logs: originalLogs,
      metrics: originalMetrics,
      created_at,
      started_at,
      completed_at,
      ...restPrediction // Capture remaining fields
    } = prediction;

    // Map to standardized format
    const standardizedData: z.infer<
      typeof GetPredictionStatusResponseDataSchema
    > = {
      taskId: id,
      status: mapReplicateStatus(originalStatus),
      input: originalInput,
      output: originalOutput,
      error: originalError,
      logs: originalLogs,
      metrics: originalMetrics,
      createdAt: created_at,
      startedAt: started_at,
      completedAt: completed_at,
      // Include any other fields from Replicate via passthrough
      ...restPrediction,
    };

    // Validate against our schema before returning
    return GetPredictionStatusResponseDataSchema.parse(standardizedData);
  } catch (error) {
    handleReplicateError(error, `getPredictionStatus (Task ID: ${taskId})`);
    // If the API call itself failed (e.g., 404 Not Found, 401 Auth error),
    // return a standardized 'failed' status.
    return GetPredictionStatusResponseDataSchema.parse({
      taskId: taskId,
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Failed to query prediction status.",
    });
  }
};
