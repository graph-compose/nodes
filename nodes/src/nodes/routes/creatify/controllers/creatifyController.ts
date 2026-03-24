import { Request, Response } from "express";
import { z } from "zod";
import {
  CreateLipsyncResponseSchema,
  CreateMultiLipsyncRequestSchema,
  CreateSingleLipsyncRequestSchema,
  QueryTaskRequestSchema, // Import response wrapper schemas
  QueryTaskResponseSchema,
} from "../schemas/creatifySchemas";
import * as creatifyService from "../services/creatifyService";

// Helper to infer types from Zod schemas for request handlers
type CreateSingleLipsyncRequest = z.infer<
  typeof CreateSingleLipsyncRequestSchema
>;
type CreateMultiLipsyncRequest = z.infer<
  typeof CreateMultiLipsyncRequestSchema
>;
type QueryTaskRequest = z.infer<typeof QueryTaskRequestSchema>;

/**
 * Handles the request to create a single avatar lipsync task.
 * Assumes request body is validated by middleware.
 */
export const handleCreateSingleAvatarVideo = async (
  req: Request<Record<string, never>, unknown, CreateSingleLipsyncRequest>,
  res: Response,
) => {
  try {
    // Call the service function with the validated request body
    const result = await creatifyService.startSingleLipsyncTask(req.body);

    // Format the successful response using the standard wrapper
    // The service returns { taskId }, which matches CreatifyTaskCreateResponseDataSchema
    const responsePayload = {
      success: true,
      data: result, // Contains { taskId }
    };

    // Validate response payload against schema (optional but good practice)
    CreateLipsyncResponseSchema.parse(responsePayload);

    res.json(responsePayload);
  } catch (error: unknown) {
    console.error(
      "[Creatify Controller] Error handling single lipsync creation:",
      error,
    );
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start single avatar video task.";
    res.status(500).json({
      success: false,
      message: "Failed to initiate Creatify single avatar video task.",
      error: { details: message },
    });
  }
};

/**
 * Handles the request to create a multi-avatar lipsync task.
 * Assumes request body is validated by middleware.
 */
export const handleCreateMultiAvatarVideo = async (
  req: Request<Record<string, never>, unknown, CreateMultiLipsyncRequest>,
  res: Response,
) => {
  try {
    const result = await creatifyService.startMultiLipsyncTask(req.body);

    const responsePayload = {
      success: true,
      data: result, // Contains { taskId }
    };

    CreateLipsyncResponseSchema.parse(responsePayload);

    res.json(responsePayload);
  } catch (error: unknown) {
    console.error(
      "[Creatify Controller] Error handling multi-avatar lipsync creation:",
      error,
    );
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start multi-avatar video task.";
    res.status(500).json({
      success: false,
      message: "Failed to initiate Creatify multi-avatar video task.",
      error: { details: message },
    });
  }
};

/**
 * Handles the request to query the status of a lipsync task.
 * Assumes request body is validated by middleware.
 */
export const handleQueryTaskStatus = async (
  req: Request<Record<string, never>, unknown, QueryTaskRequest>,
  res: Response,
) => {
  try {
    // Call the service function to get the status
    const taskResult = await creatifyService.getTaskStatus(req.body);

    // Format the successful response using the standard wrapper
    // The service returns data conforming to CreatifyTaskResultDataSchema
    const responsePayload = {
      success: true,
      data: taskResult,
    };

    // Validate response payload against schema
    QueryTaskResponseSchema.parse(responsePayload);

    res.json(responsePayload);
  } catch (error: unknown) {
    console.error(
      "[Creatify Controller] Error handling task status query:",
      error,
    );
    // Note: The service layer already handles API errors and returns a standardized
    // 'failed' status object in those cases. This catch block handles unexpected
    // errors within the controller or service logic itself.
    const message =
      error instanceof Error
        ? error.message
        : "Failed to query Creatify task status.";
    res.status(500).json({
      success: false,
      message: "Failed to retrieve Creatify task status.",
      error: { details: message },
    });
  }
};
