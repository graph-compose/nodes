import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponse,
  SuccessResponse,
} from "../../../../types/api-response";
import {
  BaseTaskResultDataSchema,
  QueryTaskRequestSchema,
} from "../schemas/sharedSchemas";
import {
  GenerateVideoExtensionRequestSchema,
  GenerateVideoFromImageRequestSchema,
  GenerateVideoFromTextRequestSchema,
  QueryVideoTaskResponseSchema,
} from "../schemas/videoSchemas";
import { KlingApiService } from "../services/klingaiApiService";

// Instantiate the service
const klingaiService = new KlingApiService();

// --- Define Response Body Types ---

type GenerateVideoResponseBody =
  | SuccessResponse<z.infer<typeof BaseTaskResultDataSchema>>
  | ApiErrorResponse;
// Using BaseTaskResultDataSchema as the success data type for initial generation responses

type QueryVideoTaskResponseBody =
  | SuccessResponse<z.infer<typeof QueryVideoTaskResponseSchema>["data"]>
  | ApiErrorResponse;

// --- Define Request Handler Types ---

type GenerateVideoFromTextRequest = Request<
  Record<string, never>,
  GenerateVideoResponseBody,
  z.infer<typeof GenerateVideoFromTextRequestSchema>
>;
type GenerateVideoFromImageRequest = Request<
  Record<string, never>,
  GenerateVideoResponseBody,
  z.infer<typeof GenerateVideoFromImageRequestSchema>
>;
type GenerateVideoExtensionRequest = Request<
  Record<string, never>,
  GenerateVideoResponseBody,
  z.infer<typeof GenerateVideoExtensionRequestSchema>
>;
type QueryVideoTaskRequest = Request<
  Record<string, never>,
  QueryVideoTaskResponseBody,
  z.infer<typeof QueryTaskRequestSchema>
>;

// --- Helper for Error Handling ---
const handleControllerError = (
  res: Response<ApiErrorResponse>,
  error: unknown,
  context: string,
) => {
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  console.error(
    `[VideoController] Error during ${context}: ${errorMessage}`,
    error,
  );
  const errorResponse: ApiErrorResponse = {
    success: false,
    message: errorMessage || `Failed during ${context}.`,
    data: null,
  };
  res.status(500).json(errorResponse);
};

// --- Controller Handlers ---

/**
 * Controller for handling text-to-video generation requests.
 */
export const generateVideoFromTextHandler = async (
  req: GenerateVideoFromTextRequest,
  res: Response<GenerateVideoResponseBody>,
): Promise<void> => {
  try {
    console.log("[VideoController] Received request for text-to-video.");
    const resultData = await klingaiService.generateVideoFromText(req.body);
    const response: SuccessResponse<typeof resultData> = {
      success: true,
      data: resultData,
      message: "Text-to-video generation task initiated successfully.",
    };
    res.json(response);
  } catch (error) {
    handleControllerError(res, error, "text-to-video generation");
  }
};

/**
 * Controller for handling image-to-video generation requests.
 */
export const generateVideoFromImageHandler = async (
  req: GenerateVideoFromImageRequest,
  res: Response<GenerateVideoResponseBody>,
): Promise<void> => {
  try {
    console.log("[VideoController] Received request for image-to-video.");
    const resultData = await klingaiService.generateVideoFromImage(req.body);
    const response: SuccessResponse<typeof resultData> = {
      success: true,
      data: resultData,
      message: "Image-to-video generation task initiated successfully.",
    };
    res.json(response);
  } catch (error) {
    handleControllerError(res, error, "image-to-video generation");
  }
};

/**
 * Controller for handling video extension requests.
 */
export const generateVideoExtensionHandler = async (
  req: GenerateVideoExtensionRequest,
  res: Response<GenerateVideoResponseBody>,
): Promise<void> => {
  try {
    console.log("[VideoController] Received request for video extension.");
    const resultData = await klingaiService.generateVideoExtension(req.body);
    const response: SuccessResponse<typeof resultData> = {
      success: true,
      data: resultData,
      message: "Video extension generation task initiated successfully.",
    };
    res.json(response);
  } catch (error) {
    handleControllerError(res, error, "video extension");
  }
};

/**
 * Controller for handling TEXT-TO-VIDEO task status query requests.
 */
export const queryTextToVideoTaskHandler = async (
  req: QueryVideoTaskRequest,
  res: Response<QueryVideoTaskResponseBody>,
): Promise<void> => {
  const taskId = req.body.task_id;
  const context = `querying text-to-video task ${taskId}`;
  try {
    console.log(`[VideoController] ${context}`);
    const { accessKey, secretKey } = req.body;
    const resultData = await klingaiService.queryTextToVideoTask(
      { accessKey, secretKey },
      taskId,
    );
    const response: SuccessResponse<typeof resultData> = {
      success: true,
      data: resultData,
      message: "Text-to-video task status queried successfully.",
    };
    res.json(response);
  } catch (error) {
    handleControllerError(res, error, context);
  }
};

/**
 * Controller for handling IMAGE-TO-VIDEO task status query requests.
 */
export const queryImageToVideoTaskHandler = async (
  req: QueryVideoTaskRequest,
  res: Response<QueryVideoTaskResponseBody>,
): Promise<void> => {
  const taskId = req.body.task_id;
  const context = `querying image-to-video task ${taskId}`;
  try {
    console.log(`[VideoController] ${context}`);
    const { accessKey, secretKey } = req.body;
    const resultData = await klingaiService.queryImageToVideoTask(
      { accessKey, secretKey },
      taskId,
    );
    const response: SuccessResponse<typeof resultData> = {
      success: true,
      data: resultData,
      message: "Image-to-video task status queried successfully.",
    };
    res.json(response);
  } catch (error) {
    handleControllerError(res, error, context);
  }
};

/**
 * Controller for handling VIDEO EXTENSION task status query requests.
 */
export const queryVideoExtensionTaskHandler = async (
  req: QueryVideoTaskRequest,
  res: Response<QueryVideoTaskResponseBody>,
): Promise<void> => {
  const taskId = req.body.task_id;
  const context = `querying video extension task ${taskId}`;
  try {
    console.log(`[VideoController] ${context}`);
    const { accessKey, secretKey } = req.body;
    const resultData = await klingaiService.queryVideoExtensionTask(
      { accessKey, secretKey },
      taskId,
    );
    const response: SuccessResponse<typeof resultData> = {
      success: true,
      data: resultData,
      message: "Video extension task status queried successfully.",
    };
    res.json(response);
  } catch (error) {
    handleControllerError(res, error, context);
  }
};
