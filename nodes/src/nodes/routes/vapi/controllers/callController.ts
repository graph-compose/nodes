import { Request, Response } from "express";
import { CreateCallRequest } from "../schemas/callSchemas"; // Import request type for typing
import * as vapiService from "../services/vapiService";

export async function handleCreateCall(
  req: Request<object, any, CreateCallRequest, object>,
  res: Response,
) {
  try {
    // Request body is assumed to be validated by middleware upstream (in router.ts)
    const callResult = await vapiService.createVapiCall(req.body);

    // Send standardized success response
    // Vapi uses 201 Created, we'll stick to 200 for consistency unless specified otherwise
    res.status(200).json({
      success: true,
      data: callResult, // `callResult` already matches CallResultDataSchema
    });
  } catch (error: unknown) {
    console.error("[CallController] Error creating Vapi call:", error);

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during the Vapi call operation.";

    // Send standardized error response
    res.status(500).json({
      success: false,
      message: "Failed to create Vapi call.", // User-friendly summary
      error: {
        details: message, // More specific error details
      },
    });
  }
}
