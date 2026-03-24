import { Request, Response } from "express";
import { z } from "zod";
import {
  WriteContentRequestSchema,
  WriteContentResponseSchema,
} from "../schemas/writeSchemas";
import { storageWriteService } from "../services/writeService";

// Infer type for request body from schema
type WriteContentRequest = z.infer<typeof WriteContentRequestSchema>;

export async function writeContentController(
  req: Request<Record<string, string>, any, WriteContentRequest>,
  res: Response,
) {
  try {
    const result = await storageWriteService.writeContent(req.body);

    // Use zod schema to shape the success response
    const responsePayload = WriteContentResponseSchema.parse({
      success: true,
      message: "Content written successfully.",
      data: result,
    });

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("[WriteController] Error in storage write:", error);

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
