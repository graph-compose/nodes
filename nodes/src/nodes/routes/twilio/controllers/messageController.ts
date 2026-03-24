import { Request, Response } from "express";
import type { SendSmsRequest } from "../schemas/twilioSchemas"; // For type inference
import { twilioMessageService } from "../services/messageService";

/**
 * Controller to handle sending SMS messages via Twilio.
 * Assumes request body is validated by middleware before reaching this handler.
 */
export async function sendMessage(
  req: Request<Record<string, never>, any, SendSmsRequest>,
  res: Response,
) {
  try {
    console.log("[TwilioController] Received request to send SMS");
    // The request body (req.body) is already validated by the middleware in router.ts
    // and its type is inferred as SendSmsRequest.
    const resultData = await twilioMessageService.sendSms(req.body);

    console.log("[TwilioController] SMS sent successfully via service");
    // Respond according to the standard success format
    res.json({
      success: true,
      data: resultData, // Data should conform to SmsResultDataSchema
    });
  } catch (error: unknown) {
    console.error("[TwilioController] Error sending SMS:", error);

    // Format the error response according to the standard
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while sending the SMS.";

    res.status(500).json({
      success: false,
      message: "Failed to send SMS message.", // User-friendly summary
      error: {
        details: message, // More specific error details from the service/error
      },
    });
  }
}
