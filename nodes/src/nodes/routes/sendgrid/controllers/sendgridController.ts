import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponse,
  SuccessResponse,
} from "../../../../types/api-response";
import {
  SendEmailRequestSchema,
  SendEmailResultDataSchema,
} from "../schemas/sendgridSchemas"; // Schemas will be moved here later
import { sendgridService } from "../services/sendgridService";

/**
 * @summary Send an email via SendGrid
 * @description Send a fully featured email through SendGrid's delivery service. Supports:
 * - Single or multiple recipients (To, CC, BCC)
 * - HTML and plain text content
 * - File attachments (PDF, images, etc.)
 * - Scheduled sending
 * - Custom headers and reply-to
 * - Recipient name personalization
 * @tags email, transactional
 * @param req Express Request object containing validated SendEmailRequestSchema in the body.
 * @param res Express Response object.
 */
export async function sendEmail(
  req: Request<
    Record<string, never>, // No URL params
    Record<string, never>, // Response body type defined by SuccessResponse/ApiErrorResponse
    z.infer<typeof SendEmailRequestSchema> // Request body type after validation
  >,
  res: Response<
    | SuccessResponse<z.infer<typeof SendEmailResultDataSchema>>
    | ApiErrorResponse
  >,
) {
  try {
    const { apiKey, ...emailData } = req.body; // Extract apiKey, pass the rest as emailData
    console.log("[SendGridController] Sending email via SendGridService");

    // Call the refactored service
    const result = await sendgridService.sendEmail(apiKey, emailData);

    // Construct the standard success response
    const successResponse: SuccessResponse<
      z.infer<typeof SendEmailResultDataSchema>
    > = {
      success: true,
      data: result, // Service now returns only the core data { messageId }
      message: "Email sent successfully",
    };

    console.log(
      "[SendGridController] Email sent successfully, returning response.",
    );
    res.status(200).json(successResponse); // Use 200 OK for successful queueing
  } catch (error: unknown) {
    console.error("[SendGridController] Error sending email:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Construct the standard error response
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: message || "Failed to send email.", // Use captured error message or default
      data: null, // Added 'data: null'
    };

    // Determine appropriate status code (e.g., 400 for validation, 500 for service errors)
    // For simplicity, using 500 for any caught error here. Refine if needed.
    res.status(500).json(errorResponse);
  }
}
