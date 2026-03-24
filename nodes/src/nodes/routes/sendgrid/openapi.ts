import { createDocument } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  SendEmailRequestSchema,
  SendEmailResponseSchema,
} from "./schemas/sendgridSchemas";

// Create OpenAPI document for SendGrid integration
export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "SendGrid Email Integration",
      version: "1.0.0",
      description: `Powerful email delivery service integration that enables sending transactional and marketing emails through SendGrid's API.

Key Features:
- Rich HTML and plain text email support
- Multiple recipient types (To, CC, BCC)
- File attachments with various formats
- Scheduled email delivery
- Custom headers and reply-to addresses
- Recipient name personalization

Getting Started:
1. Obtain a SendGrid API key from your SendGrid account
2. Use the /sendgrid/send endpoint to send emails
3. Monitor delivery status through SendGrid's dashboard

For detailed API documentation, visit: https://docs.sendgrid.com/api-reference`,
    },
    externalDocs: {
      description: "SendGrid API Documentation",
      url: "https://docs.sendgrid.com/api-reference",
    },
    paths: {
      "/sendgrid/send": {
        post: {
          summary: "Send an email via SendGrid",
          description: `Send a fully featured email through SendGrid's delivery service.

Features:
- Single or multiple recipients (To, CC, BCC)
- HTML and plain text content
- File attachments (PDF, images, etc.)
- Scheduled sending
- Custom headers and reply-to
- Recipient name personalization

Workflow:
1. The API accepts the email content and configuration
2. Validates the input data
3. Sends the email through SendGrid
4. Returns a message ID for tracking

Note: At least one recipient and either HTML or text content is required.

Full Path: /nodes/sendgrid/send`,
          tags: ["SendGrid"],
          requestBody: {
            required: true,
            description:
              "Email configuration including recipients, content, and optional features",
            content: {
              "application/json": {
                schema: SendEmailRequestSchema,
              },
            },
          },
          responses: {
            [HTTP_STATUS.OK]: {
              description:
                "Email successfully queued for delivery with tracking information",
              content: {
                "application/json": {
                  schema: SendEmailResponseSchema,
                },
              },
            },
            [HTTP_STATUS.BAD_REQUEST]: {
              description: `Bad Request - Request validation failed. Common causes:
- Missing required fields
- Invalid email addresses
- Missing both HTML and text content
- Invalid attachment format`,
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.UNAUTHORIZED]: {
              description: "Unauthorized - Invalid or missing SendGrid API key",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.UNPROCESSABLE_ENTITY]: {
              description: `Unprocessable Entity - Request format is valid but execution failed. Common causes:
- Rate limit exceeded
- Invalid sender domain
- Blocked recipient
- Attachment too large`,
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
              description:
                "Internal Server Error - SendGrid service error or integration failure",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [HTTP_STATUS.SERVICE_UNAVAILABLE]: {
              description:
                "Service Unavailable - SendGrid API is temporarily unavailable",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
    },
  });

  return {
    ...document,
    meta: {
      tags: ["email", "sendgrid", "notifications", "communication"],
      imageUrl: "https://www.cdnlogo.com/logos/s/48/sendgrid.svg",
      sourceUrl: "https://sendgrid.com",
      description: `SendGrid is a cloud-based email delivery platform that enables reliable transactional and marketing email delivery.
      
Features:
- High deliverability rates
- Real-time analytics and tracking
- Template management
- Webhook integration
- SMTP relay service
- API-first architecture
- Comprehensive documentation`,
      provider: "SendGrid",
      category: "email",
      features: [
        "Transactional email delivery",
        "HTML and plain text support",
        "File attachments",
        "Scheduled sending",
        "Multiple recipients (To, CC, BCC)",
        "Delivery tracking",
        "High deliverability rates",
        "Real-time analytics",
        "Template management",
        "Webhook integration",
      ],
      pricing:
        "Usage-based pricing with free tier available (up to 100 emails/day)",
      documentation: "https://docs.sendgrid.com",
      support: "https://support.sendgrid.com",
    },
  };
};
