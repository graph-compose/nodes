import { Request, Response } from "express";
import { z } from "zod";
import { SendEmailRequestSchema } from "../schemas/emailSchemas";
import * as emailService from "../services/emailService";

// Infer the request body type from the Zod schema
type SendEmailRequestBody = z.infer<typeof SendEmailRequestSchema>;

/**
 * Controller function to handle sending an email.
 * Assumes the request body has been validated by preceding middleware (though not implemented per request).
 * Calls the email service and formats the response according to standards.
 */
export async function sendEmailController(
  // Use Record<string, never> for unused params and any for generic response placeholder
  req: Request<Record<string, never>, any, SendEmailRequestBody>,
  res: Response, // Response typing is handled by res.json()
) {
  try {
    // Call the service function with the validated request body
    const resultData = await emailService.sendEmail(req.body);

    // Send the standardized success response
    // The service returns data that conforms to SendEmailResultDataSchema
    res.json({
      success: true,
      data: resultData,
    });
  } catch (error: unknown) {
    // Log the error originating from the service layer
    console.error("[EmailController] Error sending email:", error);

    // Determine the error message
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during the email operation.";

    // Send the standardized error response
    res.status(500).json({
      success: false,
      message: "Failed to send email.", // User-friendly generic message
      error: {
        details: message, // Provide specific details from the service error
      },
    });
  }
}
