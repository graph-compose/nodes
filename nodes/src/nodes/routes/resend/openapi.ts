import { createDocument } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  SendEmailRequestSchema,
  SendEmailSuccessResponseSchema,
} from "./schemas/emailSchemas";

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Resend Email API",
      version: "1.0.0",
      description: `API for sending transactional and marketing emails via the Resend service.

## Overview
This endpoint allows you to send emails with features like attachments, tags, CC, BCC, and custom reply-to addresses.

## Authentication
Requires a Resend API key provided in the \`apiKey\` field of the request body. Ensure your sending domain is verified in Resend.

## Features
- Send HTML and/or plain text emails
- Support for To, CC, BCC recipients (up to 50 total)
- Attachments via Base64 content or public URL
- Custom email tags for tracking
- Custom Reply-To addresses`,
    },
    externalDocs: {
      description: "Resend API Reference",
      url: "https://resend.com/docs/api-reference/emails/send-email",
    },
    paths: {
      "/resend/email/send": {
        post: {
          summary: "Send an Email via Resend",
          description: `Sends an email using the Resend service.

**Authentication:** Requires \`apiKey\` in the request body.

**Workflow:**
1. Submit a POST request with the \`apiKey\` and email details (\`to\`, \`from\`, \`subject\`, \`html\`/\`text\`, etc.).
2. Ensure the \`from\` address domain is verified in Resend.
3. If successful, the API returns a \`200 OK\` status with the sent email ID (\`data.id\`).
4. If an error occurs, an appropriate error status code (4xx/5xx) is returned with details.

**Important Considerations:**
- Provide either \`html\` or \`text\` content (or both).
- Attachments can be Base64 \`content\` or a public URL \`path\`.
- Use \`tags\` for categorization and analytics within Resend.
- Adhere to Resend\'s sending limits and policies.`,
          tags: ["Resend"],
          requestBody: {
            required: true,
            description: "API key and email parameters for sending",
            content: {
              "application/json": {
                schema: SendEmailRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Email sent successfully. Returns the Resend email ID.",
              content: {
                "application/json": {
                  schema: SendEmailSuccessResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request body or parameters (e.g., malformed email, missing required fields like html/text, invalid tag format).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid or missing Resend API key.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description: `Request is valid, but Resend rejected it. Common causes:
- Unverified \`from\` domain.
- Invalid recipient address (e.g., bounces).
- Attachment size limit exceeded.
- Sending limits reached.`,
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            // Consider adding 429 Too Many Requests if rate limiting is specifically handled
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "An unexpected internal server error occurred, or an error occurred while communicating with the Resend API.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.SERVICE_UNAVAILABLE)]: {
              description: "Resend service is temporarily unavailable.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
          },
        },
      },
    },
    components: {
      // Schemas are automatically inferred
    },
  });

  // Add custom metadata
  return {
    ...document,
    meta: {
      tags: ["email", "communication", "transactional", "marketing", "resend"],
      provider: "Resend",
      category: "Email", // Simplified category
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/resend-icon-black.png", // Official favicon
      sourceUrl: "https://resend.com/home",
      description: `Resend is a modern email platform designed for developers to build, test, and deliver transactional and marketing emails reliably.

Key Features:
- Simple API for sending emails.
- Support for HTML and text content.
- Attachments, tags, CC, BCC, Reply-To.
- Domain verification and management.
- Webhooks for tracking email events (opens, clicks, bounces).
- Detailed analytics and logs.

Use Cases:
- Welcome emails and onboarding sequences.
- Password reset and account notifications.
- Order confirmations and invoices.
- Marketing campaigns and newsletters.`,
      features: [
        "Send HTML & Text emails",
        "Multiple recipients (To, CC, BCC)",
        "Attachments (Base64 or URL)",
        "Custom Tags for Analytics",
        "Custom Reply-To Address",
        "Domain Authentication (DKIM, SPF, DMARC)",
        "Webhook Event Tracking",
        "Email Analytics Dashboard",
      ],
      pricing: "Usage-based pricing with a generous free tier.",
      documentation: "https://resend.com/docs/api-reference/introduction",
      support: "https://resend.com/contact",
    },
  };
};
