import { Request, Response } from "express";
import { QueryTaskRequest } from "../schemas";
import * as service from "../services";

// Handler for getting task status
export const getTaskStatusController = async (
  req: Request<object, object, QueryTaskRequest>,
  res: Response,
) => {
  try {
    // Input validated by middleware
    const result = await service.getTaskStatus(req.body);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("[PixVerse Controller] Error getting task status:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get PixVerse task status.",
      error: { details: message },
    });
  }
};
