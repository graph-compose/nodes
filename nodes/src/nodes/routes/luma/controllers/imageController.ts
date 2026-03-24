import axios from "axios";
import { Request, Response } from "express";
// Ensure ONLY this import for the service exists
import type { z } from "zod";
import {
  CreateImageGenerationRequestSchema,
  GetImageGenerationBodySchema,
  GetImageGenerationParamsSchema,
  ImageGenerationResultDataSchema,
} from "../schemas/lumaSchemas";
import { lumaService } from "../services/lumaService";

// Infer types from Zod schemas
type CreateImageGenerationRequest = z.infer<
  typeof CreateImageGenerationRequestSchema
>;
type GetImageGenerationBody = z.infer<typeof GetImageGenerationBodySchema>;
type GetImageGenerationParams = z.infer<typeof GetImageGenerationParamsSchema>;
/*
type ListImageGenerationsBody = z.infer<typeof ListImageGenerationsBodySchema>;
type ListImageGenerationsQuery = z.infer<
  typeof ListImageGenerationsRequestSchema
>;
*/

type IImageGenerationResponse = z.infer<typeof ImageGenerationResultDataSchema>;
/*
type IListImageGenerationsResponse = z.infer<
  typeof ListImageGenerationsResultDataSchema
>;
*/

// Standardized Error Handling
const handleError = (
  res: Response,
  error: unknown,
  operation: string,
  statusCode = 500,
) => {
  const defaultMessage = `Failed ${operation}`;
  console.error(`[Luma Image Controller] Error ${operation}:`, error);

  let details = "An unexpected error occurred.";
  if (axios.isAxiosError(error) && error.response) {
    // Extract details from Axios error response
    const errorData = error.response.data?.error || error.response.data;

    console.log(errorData);
    details =
      typeof errorData === "string" ? errorData : JSON.stringify(errorData);
  } else if (error instanceof Error) {
    // Use standard error message
    details = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message: `${defaultMessage}.`,
    error: { details: details },
  });
};

// Controller for POST /images/generate
export const createImageGenerationController = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    CreateImageGenerationRequest
  >,
  res: Response,
) => {
  const operation = "creating image generation";
  try {
    // Separate apiKey and the rest of the data
    const { apiKey, ...imageData } = req.body;
    console.log(`[Luma Image Controller /generate] ${operation}:`, imageData);

    // Pass apiKey and imageData separately as originally intended
    const result: IImageGenerationResponse =
      await lumaService.createImageGeneration(apiKey, imageData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    handleError(res, error, operation);
  }
};

// Controller for POST /images/status/:id
export const getImageGenerationStatusController = async (
  // Replace {} with Record<string, never>
  req: Request<
    GetImageGenerationParams,
    Record<string, never>,
    GetImageGenerationBody
  >,
  res: Response,
) => {
  const operation = "getting image generation status";
  try {
    const { id } = req.params;
    const { apiKey } = req.body;

    console.log(`[Luma Image Controller /status] ${operation} for ID:`, id);
    // Call method on the imported service object
    const result: IImageGenerationResponse =
      await lumaService.getImageGeneration(id, apiKey);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    handleError(res, error, operation);
  }
};

// Controller for POST /images/list
/*
export const listImageGenerationsController = async (
  // Replace {} with Record<string, never>
  req: Request<
    Record<string, never>,
    Record<string, never>,
    ListImageGenerationsBody,
    ListImageGenerationsQuery
  >,
  res: Response,
) => {
  const operation = "listing image generations";
  try {
    const { limit, cursor } = req.query;
    const { apiKey } = req.body;

    console.log(`[Luma Image Controller /list] ${operation}`);
    // Call method on the imported service object
    const result: IListImageGenerationsResponse =
      await lumaService.listImageGenerations(apiKey, limit, cursor);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    handleError(res, error, operation);
  }
};
*/
