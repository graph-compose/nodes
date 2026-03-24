import { Request, Response } from "express";
import type { AnalyzeImageRequest } from "../schemas/visionSchemas"; // Import type for req.body
import { analyzeImageWithVision } from "../services/visionService";

// Controller function for analyzing images
export const analyzeImageController = async (
  // Use specific types instead of {} for Params and Query
  req: Request<
    Record<string, never>,
    any,
    AnalyzeImageRequest,
    Record<string, never>
  >,
  res: Response,
) => {
  try {
    // Input is validated by middleware before reaching here
    const result = await analyzeImageWithVision(req.body);
    // Service should return data that conforms to AnalyzeImageResponseDataSchema
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("[OpenAI Vision Controller] Error analyzing image:", error);

    // Use a more user-friendly top-level message
    const userMessage = "Failed to analyze image due to an internal error.";
    let statusCode = 500; // Default to 500 as per standard for service/controller errors
    let errorDetails = "An unexpected error occurred";

    if (error instanceof Error) {
      errorDetails = error.message;
      // Keep specific status code adjustments for known API key/bad request issues
      // Although standard prefers middleware for 400s, this catches service-level input issues
      if (error.message.includes("Invalid API Key")) {
        statusCode = 401;
      }
      if (
        error.message.includes("Invalid request") ||
        error.message.includes("bad image URL")
      ) {
        statusCode = 400;
      }
    }

    res.status(statusCode).json({
      success: false,
      message: userMessage, // General user message
      error: {
        details: errorDetails, // Specific details
      },
    });
  }
};
