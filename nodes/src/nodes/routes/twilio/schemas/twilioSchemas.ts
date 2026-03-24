import { z } from "zod";
import "zod-openapi/extend"; // Ensure openapi extension is imported
import { SuccessResponseSchema } from "../../../../types/api-response"; // Adjusted path relative to new location

// SMS sending request schema (Following naming convention: {Action}{Feature}RequestSchema)
export const SendSmsRequestSchema = z
  .object({
    // Authentication (always first)
    accountSid: z.string().openapi({
      description: "Your Twilio Account SID found in the Twilio Console",
    }),
    authToken: z.string().openapi({
      description: "Your Twilio Auth Token found in the Twilio Console",
    }),

    // Message parameters
    to: z.string().openapi({
      description:
        "The destination phone number in E.164 format: [+][country code][phone number including area code]",
    }),
    from: z.string().openapi({
      description:
        "Your Twilio phone number in E.164 format that will send the message",
    }),
    message: z.string().openapi({
      description: "The text content of the SMS message to send",
    }),
  })
  .openapi({
    // Note: The description here might be better placed in the openapi.ts path definition
    // Keeping it for now as requested, but consider moving for better standard adherence.
    description: "Request body for sending an SMS via Twilio.",
  });

// SMS result data schema (Following naming convention: {Feature}ResultDataSchema)
export const SmsResultDataSchema = z
  .object({
    sid: z.string().openapi({
      description: "The unique identifier for the sent message",
    }),
    status: z
      .enum(["queued", "sending", "sent", "failed", "delivered", "undelivered"])
      .openapi({
        description: "The status of the sent message",
      }),
    dateCreated: z
      .union([z.date(), z.string()])
      .transform((val) => {
        if (val instanceof Date) {
          return val.toISOString();
        }
        return val; // Assume it's already an ISO string if not a Date
      })
      .pipe(
        z.string().openapi({
          // Pipe to ensure final type is string for OpenAPI
          type: "string",
          format: "date-time",
          description:
            "The date and time the message was created (ISO 8601 format)",
        }),
      ),
    dateUpdated: z
      .union([z.date(), z.string()])
      .transform((val) => {
        if (val instanceof Date) {
          return val.toISOString();
        }
        return val; // Assume it's already an ISO string if not a Date
      })
      .pipe(
        z.string().openapi({
          // Pipe to ensure final type is string for OpenAPI
          type: "string",
          format: "date-time",
          description:
            "The date and time the message was last updated (ISO 8601 format)",
        }),
      ),
    to: z.string().openapi({
      description: "The recipient's phone number",
    }),
    from: z.string().openapi({
      description: "The Twilio phone number that sent the message",
    }),
    // Note: Consider adding other fields explicitly if they are consistently used,
    // instead of relying solely on passthrough.
    // e.g., errorCode: z.number().nullable().optional(), errorMessage: z.string().nullable().optional()
  })
  .passthrough() // Allow additional fields from Twilio
  .openapi({
    description: "Core response data containing SMS message information.",
  });

// Standardized Response wrapper (Following naming convention: {Action}{Feature}ResponseSchema)
export const SendSmsResponseSchema = SuccessResponseSchema(SmsResultDataSchema);

// Type Alias for inferred Request Schema
export type SendSmsRequest = z.infer<typeof SendSmsRequestSchema>;

// Type Alias for inferred Result Data Schema
export type SmsResultData = z.infer<typeof SmsResultDataSchema>;
