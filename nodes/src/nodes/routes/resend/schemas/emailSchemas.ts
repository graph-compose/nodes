import { z } from "zod";
import "zod-openapi/extend"; // Ensure openapi extension is imported
import { SuccessResponseSchema } from "../../../../types/api-response";

// Common OpenAPI tags for Resend schemas
const RESEND_TAGS = ["Resend"] as const;

// Schema for Resend API Key (common practice)
export const ResendAuthSchema = z
  .object({
    apiKey: z.string().min(1).openapi({
      description: "Your Resend API Key.",
      example: "re_123456789AbCdEfG",
    }),
  })
  .openapi({
    description: "Authentication using a Resend API key",
    "x-tags": RESEND_TAGS,
  });

// Schema for individual email tags
const TagSchema = z
  .object({
    name: z
      .string()
      .max(256)
      .regex(
        /^[a-zA-Z0-9_\-]+$/,
        "Tag name can only contain ASCII letters, numbers, underscores, or dashes.",
      )
      .openapi({
        description:
          "The name of the email tag (key). Max 256 characters. Allowed: a-z, A-Z, 0-9, _, -.",
        example: "campaign-id",
      }),
    value: z
      .string()
      .max(256)
      .regex(
        /^[a-zA-Z0-9_\-]+$/,
        "Tag value can only contain ASCII letters, numbers, underscores, or dashes.",
      )
      .openapi({
        description:
          "The value of the email tag. Max 256 characters. Allowed: a-z, A-Z, 0-9, _, -.",
        example: "welcome_email_v2",
      }),
  })
  .openapi({
    description:
      "Custom key/value pair for tagging emails for tracking/analytics.",
    "x-tags": RESEND_TAGS,
  });

// Schema for individual attachments
const AttachmentSchema = z
  .object({
    filename: z.string().min(1).openapi({
      description: "Name of the attached file including extension.",
      example: "invoice_march_2024.pdf",
    }),
    content: z.string().optional().openapi({
      description: "Base64 encoded content of the file.",
      example: "JVBERi0xLjQKJ[...]MjY1MCBkb2N1bWVudA==", // Truncated example
    }),
    path: z.string().url().optional().openapi({
      description: "URL path where the attachment file is publicly hosted.",
      example:
        "https://public-assets.example.com/invoices/invoice_march_2024.pdf",
    }),
    content_type: z.string().optional().openapi({
      description:
        "Optional: MIME content type. If unset, derived from filename.",
      example: "application/pdf",
    }),
  })
  .refine(
    (data) => (data.content && !data.path) || (!data.content && data.path),
    {
      message:
        "Provide either Base64 'content' or a public 'path' URL for an attachment, not both.",
      path: ["attachment"],
    },
  )
  .openapi({
    description:
      "Email attachment details. Use Base64 'content' or a public URL 'path'.",
    "x-tags": RESEND_TAGS,
  });

// Main Request schema for sending an email - Extends Auth schema
export const SendEmailRequestSchema = ResendAuthSchema.extend({
  from: z.string().email("Invalid 'from' email format").openapi({
    description:
      'Sender address (e.g., "Name <you@example.com>" or "you@example.com"). Domain MUST be verified in Resend.',
    example: "Your App <noreply@yourdomain.com>",
  }),
  to: z
    .union([z.string().email(), z.array(z.string().email()).min(1).max(50)])
    .openapi({
      description: "Primary recipient email address(es). Max 50.",
      example: ["customer@example.com"],
    }),
  subject: z.string().min(1, "Subject cannot be empty").openapi({
    description: "Email subject line.",
    example: "Your Account Update",
  }),
  bcc: z
    .union([z.string().email(), z.array(z.string().email()).min(1)])
    .optional()
    .openapi({
      description: "Bcc recipient email address(es).",
      example: "internal-archive@yourdomain.com",
    }),
  cc: z
    .union([z.string().email(), z.array(z.string().email()).min(1)])
    .optional()
    .openapi({
      description: "Cc recipient email address(es).",
      example: "manager@example.com",
    }),
  reply_to: z
    .union([z.string().email(), z.array(z.string().email()).min(1)])
    .optional()
    .openapi({
      description: "Custom reply-to email address(es).",
      example: "support@yourdomain.com",
    }),
  html: z.string().optional().openapi({
    description:
      "HTML version of the email body. Required if 'text' is not provided.",
    example: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
  }),
  text: z.string().optional().openapi({
    description:
      "Plain text version of the email body. Required if 'html' is not provided.",
    example: "Welcome! Thanks for signing up.",
  }),
  attachments: z.array(AttachmentSchema).max(10).optional().openapi({
    description:
      "Array of attachments. Max 10. Total size limits apply (see Resend docs).",
  }),
  tags: z.array(TagSchema).max(10).optional().openapi({
    description: "Array of key/value tags for categorization. Max 10 tags.",
  }),
})
  .refine((data) => data.html || data.text, {
    message: "Email body requires at least one of 'html' or 'text' content.",
    path: ["body"],
  })
  .openapi({
    description:
      "Complete request body parameters for sending an email via Resend.",
    "x-tags": RESEND_TAGS,
  });

// Export the inferred TypeScript type for the request
export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;

// Response data schema for a successful email send
export const SendEmailResultDataSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique ID of the sent email assigned by Resend.",
      example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    }),
  })
  .passthrough()
  .openapi({
    description:
      "Core response data containing the ID of the successfully sent email.",
    "x-tags": RESEND_TAGS,
  });

// Wrapped success response schema using the standard
export const SendEmailSuccessResponseSchema = SuccessResponseSchema(
  SendEmailResultDataSchema,
).openapi({
  description:
    "Standard success response wrapper for the send email operation.",
  "x-tags": RESEND_TAGS,
});

// Export the inferred TypeScript type for the success response
export type SendEmailSuccessResponse = z.infer<
  typeof SendEmailSuccessResponseSchema
>;

// No explicit error response schema defined here, as errors are handled
// generically by the controller using the standard error format.
// The controller will return a { success: false, message: ..., error?: { details: ... }} structure.
