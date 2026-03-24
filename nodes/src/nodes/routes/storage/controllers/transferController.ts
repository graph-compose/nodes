import { Request, Response } from "express";
import { z } from "zod";
import {
  TransferRequestSchema,
  TransferResponseSchema,
} from "../schemas/transferSchemas";
import { storageTransferService } from "../services/transferService";

// Infer type for request body
type TransferRequest = z.infer<typeof TransferRequestSchema>;

export async function transferController(
  req: Request<Record<string, string>, any, TransferRequest>,
  res: Response,
) {
  try {
    const result = await storageTransferService.transferFile(req.body);

    // Use zod schema to shape the success response
    const responsePayload = TransferResponseSchema.parse({
      success: true,
      message: "Transfer completed successfully.",
      data: result,
    });

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("[TransferController] Error in storage transfer:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const errorDetails =
      error instanceof Error ? error.stack : "Unknown error details";

    // Standardized error response
    return res.status(500).json({
      success: false,
      message: message,
      error: {
        details: errorDetails,
      },
    });
  }
}
