import { Request, Response } from "express";
import {
  CreateImageToVideoRequest,
  CreateTextToVideoRequest,
  CreateTransitionRequest,
} from "../schemas";
import * as service from "../services";

// Handler for creating text-to-video tasks
export const createTextToVideoController = async (
  req: Request<object, object, CreateTextToVideoRequest>,
  res: Response,
) => {
  try {
    // Input validated by middleware
    const result = await service.createTextToVideo(req.body);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error(
      "[PixVerse Controller] Error creating text-to-video task:",
      error,
    );
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to create PixVerse text-to-video task.",
      error: { details: message },
    });
  }
};

// Handler for creating image-to-video tasks
export const createImageToVideoController = async (
  req: Request<object, object, CreateImageToVideoRequest>,
  res: Response,
) => {
  try {
    // Input validated by middleware
    const result = await service.createImageToVideo(req.body);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error(
      "[PixVerse Controller] Error creating image-to-video task:",
      error,
    );
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to create PixVerse image-to-video task.",
      error: { details: message },
    });
  }
};

// Handler for creating transition tasks
export const createTransitionController = async (
  req: Request<object, object, CreateTransitionRequest>,
  res: Response,
) => {
  try {
    // Input validated by middleware
    const result = await service.createTransition(req.body);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error(
      "[PixVerse Controller] Error creating transition task:",
      error,
    );
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to create PixVerse transition task.",
      error: { details: message },
    });
  }
};
