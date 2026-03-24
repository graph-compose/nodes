import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponse,
  SuccessResponse,
} from "../../../../types/api-response";
import {
  GenerateImageRequestSchema,
  GenerateImageResponseSchema,
  QueryImageTaskResponseSchema,
} from "../schemas/imageSchemas";
import { QueryTaskRequestSchema } from "../schemas/sharedSchemas";
import { KlingApiService } from "../services/klingaiApiService";

// Instantiate the service
const klingaiService = new KlingApiService();

// Define response body types
type GenerateImageResponseBody =
  | SuccessResponse<z.infer<typeof GenerateImageResponseSchema>["data"]>
  | ApiErrorResponse;
type QueryImageTaskResponseBody =
  | SuccessResponse<z.infer<typeof QueryImageTaskResponseSchema>["data"]>
  | ApiErrorResponse;

// Define types for request handlers using the response body types
type GenerateImageRequest = Request<
  Record<string, never>,
  GenerateImageResponseBody,
  z.infer<typeof GenerateImageRequestSchema>
>;
type QueryImageTaskRequest = Request<
  Record<string, never>,
  QueryImageTaskResponseBody,
  z.infer<typeof QueryTaskRequestSchema>
>;

/**
 * Controller for handling image generation requests.
 */
export const generateImageHandler = async (
  req: GenerateImageRequest,
  res: Response<GenerateImageResponseBody>,
): Promise<void> => {
  try {
    console.log("[ImageController] Received request to generate image.");
    // Input is already validated by middleware (to be added in router.ts)
    const params = req.body;

    const resultData = await klingaiService.generateImage(params);

    console.log(
      "[ImageController] Image generation task initiated successfully.",
    );
    // Type assertion for success case
    const response: SuccessResponse<typeof resultData> = {
      success: true,
      data: resultData,
      message: "Image generation task initiated successfully.",
    };
    res.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error(
      `[ImageController] Error generating image: ${message}`,
      error,
    );
    // Type assertion for error case, ensure structure matches ApiErrorResponse
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: message || "Failed to initiate image generation task.",
      data: null,
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Controller for handling image task status query requests.
 */
export const queryImageTaskHandler = async (
  req: QueryImageTaskRequest,
  res: Response<QueryImageTaskResponseBody>,
): Promise<void> => {
  try {
    console.log(
      "[ImageController] Received request to query image task status.",
    );
    // Input is validated by middleware
    const { accessKey, secretKey, task_id } = req.body;

    const resultData = await klingaiService.queryImageTask(
      { accessKey, secretKey },
      task_id,
    );

    console.log(
      `[ImageController] Successfully queried status for task ${task_id}.`,
    );
    // Type assertion for success case
    const response: SuccessResponse<typeof resultData> = {
      success: true,
      data: resultData,
      message: "Image task status queried successfully.",
    };
    res.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error(
      `[ImageController] Error querying image task status: ${message}`,
      error,
    );
    // Type assertion for error case, ensure structure matches ApiErrorResponse
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: message || "Failed to query image task status.",
      data: null,
    };
    res.status(500).json(errorResponse);
  }
};
