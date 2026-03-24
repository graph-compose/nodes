import axios from "axios"; // Import axios for type checking
import { Request, Response } from "express";
import type { z } from "zod";
import {
  CreateVideoGenerationRequestSchema,
  GetVideoGenerationBodySchema,
  GetVideoGenerationParamsSchema,
  // ListVideoGenerationsBodySchema,
  // ListVideoGenerationsRequestSchema,
  // ListVideoGenerationsResultDataSchema,
  // Import Zod types for inference
  VideoGenerationResultDataSchema,
} from "../schemas/lumaSchemas";
import { lumaService } from "../services/lumaService"; // Import the exported service object

// Infer types from Zod schemas
type CreateVideoGenerationRequest = z.infer<
  typeof CreateVideoGenerationRequestSchema
>;
type GetVideoGenerationBody = z.infer<typeof GetVideoGenerationBodySchema>;
type GetVideoGenerationParams = z.infer<typeof GetVideoGenerationParamsSchema>;
/*
type ListVideoGenerationsBody = z.infer<typeof ListVideoGenerationsBodySchema>;
type ListVideoGenerationsQuery = z.infer<
  typeof ListVideoGenerationsRequestSchema
>; // Query params
*/

// Infer types for service responses
type IVideoGenerationResponse = z.infer<typeof VideoGenerationResultDataSchema>;
/*
type IListVideoGenerationsResponse = z.infer<
  typeof ListVideoGenerationsResultDataSchema
>;
*/

// Standardized Error Handling (same as imageController)
const handleError = (
  res: Response,
  error: unknown,
  operation: string,
  statusCode = 500,
) => {
  const defaultMessage = `Failed ${operation}`;
  console.error(`[Luma Video Controller] Error ${operation}:`, error);

  let details = "An unexpected error occurred.";
  if (axios.isAxiosError(error) && error.response) {
    const errorData = error.response.data?.error || error.response.data;
    details =
      typeof errorData === "string" ? errorData : JSON.stringify(errorData);
  } else if (error instanceof Error) {
    details = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message: `${defaultMessage}.`,
    error: { details: details },
  });
};

// Controller for POST /videos/generate
export const createVideoGenerationController = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    CreateVideoGenerationRequest
  >,
  res: Response,
) => {
  const operation = "creating video generation";
  try {
    const { apiKey, ...videoData } = req.body;
    console.log(`[Luma Video Controller /generate] ${operation}:`, videoData);

    const result: IVideoGenerationResponse =
      await lumaService.createVideoGeneration(apiKey, videoData);

    res.json({
      success: true,
      data: result, // Service should return data matching VideoGenerationResultDataSchema
    });
  } catch (error: unknown) {
    handleError(res, error, operation);
  }
};

// Controller for POST /videos/status/:id
export const getVideoGenerationStatusController = async (
  req: Request<
    GetVideoGenerationParams,
    Record<string, never>,
    GetVideoGenerationBody
  >,
  res: Response,
) => {
  const operation = "getting video generation status";
  try {
    const { id } = req.params;
    const { apiKey } = req.body;

    console.log(`[Luma Video Controller /status] ${operation} for ID:`, id);
    const result: IVideoGenerationResponse =
      await lumaService.getVideoGeneration(id, apiKey);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    handleError(res, error, operation);
  }
};

// Controller for POST /videos/list
/*
export const listVideoGenerationsController = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    ListVideoGenerationsBody,
    ListVideoGenerationsQuery
  >,
  res: Response,
) => {
  const operation = "listing video generations";
  try {
    const { limit, cursor } = req.query;
    const { apiKey } = req.body;

    console.log(`[Luma Video Controller /list] ${operation}`);
    const result: IListVideoGenerationsResponse =
      await lumaService.listVideoGenerations(apiKey, limit, cursor);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    handleError(res, error, operation);
  }
};
*/
