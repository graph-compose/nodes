import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";

// Common OpenAPI tags for SendGrid schemas
const SENDGRID_TAGS = ["SendGrid"] as const;

// Email recipient schema
const EmailRecipientSchema = z
  .object({
    email: z.string().email().openapi({
      description: "Email address",
      example: "recipient@example.com",
    }),
    name: z.string().optional().openapi({
      description: "Recipient name",
      example: "John Doe",
    }),
  })
  .openapi({
    description: "Email recipient information",
    "x-tags": SENDGRID_TAGS,
  });

// Email attachment schema
const EmailAttachmentSchema = z
  .object({
    content: z.string().openapi({
      description: "Base64 encoded content",
      example: "SGVsbG8gV29ybGQ=",
    }),
    filename: z.string().openapi({
      description: "Attachment filename",
      example: "document.pdf",
    }),
    type: z.string().optional().openapi({
      description: "MIME type",
      example: "application/pdf",
    }),
    disposition: z.enum(["attachment", "inline"]).optional().openapi({
      description: "Attachment disposition",
      example: "attachment",
    }),
  })
  .openapi({
    description: "Email attachment details",
    "x-tags": SENDGRID_TAGS,
  });

// Email data schema
export const SendEmailDataSchema = z
  .object({
    from: EmailRecipientSchema.openapi({ description: "Email sender" }),
    to: z
      .array(EmailRecipientSchema)
      .min(1)
      .openapi({
        description: "Primary recipients",
        example: [{ email: "recipient@example.com", name: "John Doe" }],
      }),
    cc: z
      .array(EmailRecipientSchema)
      .optional()
      .openapi({ description: "Carbon copy recipients" }),
    bcc: z
      .array(EmailRecipientSchema)
      .optional()
      .openapi({ description: "Blind carbon copy recipients" }),
    subject: z.string().openapi({
      description: "Email subject",
      example: "Important Update",
    }),
    text: z.string().optional().openapi({
      description: "Plain text email body",
      example: "Hello, this is a test email.",
    }),
    html: z.string().optional().openapi({
      description: "HTML email body",
      example: "<h1>Hello</h1><p>This is a test email.</p>",
    }),
    attachments: z
      .array(EmailAttachmentSchema)
      .optional()
      .openapi({ description: "Email attachments" }),
    replyTo: EmailRecipientSchema.optional().openapi({
      description: "Reply-to email address",
    }),
    sendAt: z.number().optional().openapi({
      description: "Unix timestamp to schedule email sending",
      example: 1735689600,
    }),
  })
  .openapi({
    description: "Complete email data structure",
    "x-tags": SENDGRID_TAGS,
  });

// Send email request schema
export const SendEmailRequestSchema = z
  .object({
    apiKey: z.string().openapi({
      description: "SendGrid API key",
      example: "SG.xxxxx",
    }),
  })
  .merge(SendEmailDataSchema)
  .refine((data) => data.text || data.html, {
    message: "Either text or html body must be provided",
    path: ["text", "html"],
  })
  .openapi({
    description: "Complete request body for sending an email",
    "x-tags": SENDGRID_TAGS,
  });

// Send email result schema
export const SendEmailResultDataSchema = z
  .object({
    messageId: z.string().openapi({
      description: "Unique identifier for the sent email from SendGrid",
      example: "abc123def456",
    }),
  })
  .openapi({
    description: "Core data returned upon successful email sending",
    "x-tags": SENDGRID_TAGS,
  });

// Send email response schema
export const SendEmailResponseSchema = SuccessResponseSchema(
  SendEmailResultDataSchema,
).openapi({
  description: "Successful email sending response",
  "x-tags": SENDGRID_TAGS,
});

// Export types
export type SendEmailData = z.infer<typeof SendEmailDataSchema>;
export type SendEmailResultData = z.infer<typeof SendEmailResultDataSchema>;

// NOTE: OpenAPI document generation is moved to openapi.ts
