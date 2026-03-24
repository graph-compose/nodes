import { Request, Response } from "express";
import { z } from "zod";
import {
  GenerateVideoRequestBodySchema, // Need this for validation middleware type hint
  TaskActionParamsSchema, // Need this for validation middleware type hint
  TaskActionRequestBodySchema,
} from "../schemas/requestSchemas"; // Import Zod schemas for type inference
import {
  GenerateVideoResponseSchema,
  GetTaskStatusResponseSchema,
} from "../schemas/responseSchemas"; // Import response wrapper schemas
import * as runwayService from "../services/runwayService";

/**
 * Controller to handle the initiation of video generation.
 */
export async function generateVideo(
  // Params: Record<string, never> as no URL params are used
  // ResBody: Record<string, never> as response body is unused in handler definition
  // ReqBody: Expected type after validation
  req: Request<
    Record<string, never>,
    Record<string, never>,
    z.infer<typeof GenerateVideoRequestBodySchema>
  >,
  res: Response,
) {
  try {
    const taskResult = await runwayService.startVideoGeneration(req.body);
    const response: z.infer<typeof GenerateVideoResponseSchema> = {
      success: true,
      data: taskResult,
      message: "Video generation task started successfully.",
    };
    res.json(response);
  } catch (error: unknown) {
    console.error("[RunwayController] Failed generating video:", error);
    const message =
      error instanceof Error ? error.message : "Unknown service error";
    res.status(500).json({
      success: false,
      message: "Failed to start video generation task.",
      error: { details: message },
    });
  }
}

/**
 * Controller to handle retrieving the status of a task.
 */
export async function getStatus(
  req: Request<
    z.infer<typeof TaskActionParamsSchema>,
    Record<string, never>,
    z.infer<typeof TaskActionRequestBodySchema>
  >,
  res: Response,
) {
  try {
    const taskStatus = await runwayService.getTaskStatus(req.params, req.body);
    const response: z.infer<typeof GetTaskStatusResponseSchema> = {
      success: true,
      data: taskStatus,
      message: "Task status retrieved successfully.",
    };
    res.json(response);
  } catch (error: unknown) {
    console.error("[RunwayController] Failed getting task status:", error);
    const message =
      error instanceof Error ? error.message : "Unknown service error";
    res.status(500).json({
      success: false,
      message: "Failed to retrieve task status.",
      error: { details: message },
    });
  }
}

/**
 * Controller to handle deleting (canceling) a task.
 */
export async function cancelTask(
  req: Request<
    z.infer<typeof TaskActionParamsSchema>,
    Record<string, never>,
    z.infer<typeof TaskActionRequestBodySchema>
  >,
  res: Response,
) {
  try {
    await runwayService.deleteTask(req.params, req.body);
    res.status(204).send();
  } catch (error: unknown) {
    console.error("[RunwayController] Failed canceling task:", error);
    const message =
      error instanceof Error ? error.message : "Unknown service error";
    res.status(500).json({
      success: false,
      message: "Failed to cancel task.",
      error: { details: message },
    });
  }
}
