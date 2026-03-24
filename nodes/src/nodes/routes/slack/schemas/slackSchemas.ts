import { z } from "zod";
import "zod-openapi/extend"; // Ensure openapi extension is imported
import { SuccessResponseSchema } from "../../../../types/api-response"; // Corrected path

// Common OpenAPI tags for Slack schemas
const SLACK_TAGS = ["Slack"] as const;

// --- Reusable Content Blocks ---

const TextBlockContent = z
  .object({
    type: z.enum(["plain_text", "mrkdwn"]).openapi({
      description: "Text format: `plain_text` or `mrkdwn` for formatting.",
      example: "mrkdwn",
    }),
    text: z.string().openapi({
      description: "The actual text content.",
      example: "*Bold text* and `code`",
    }),
    emoji: z.boolean().optional().openapi({
      description: "Whether to render emoji characters (e.g., :smile:).",
      example: true,
    }),
  })
  .openapi({
    description: "Schema for Slack Text Objects within blocks.",
    "x-tags": SLACK_TAGS,
  });

/**
 * Block Schema - Represents a Slack Block Kit component
 * @see https://api.slack.com/block-kit
 */
const BlockSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("section").openapi({
        description: "Section block - basic text block, can include fields.",
      }),
      block_id: z.string().optional().openapi({
        description: "Unique block identifier",
        example: "sec_123",
      }),
      text: TextBlockContent.openapi({
        description: "Primary text content for the section.",
      }),
      fields: z.array(TextBlockContent).optional().openapi({
        description: "Optional fields displayed in a two-column grid.",
      }),
    }),
    z.object({
      type: z.literal("image").openapi({
        description: "Image block - displays an image.",
      }),
      block_id: z.string().optional().openapi({
        description: "Unique block identifier",
        example: "img_456",
      }),
      image_url: z.string().url().openapi({
        description: "Publicly accessible URL of the image.",
        example: "https://example.com/image.png",
      }),
      alt_text: z.string().openapi({
        description: "Alternative text for accessibility.",
        example: "A cute cat playing with yarn",
      }),
      title: TextBlockContent.optional().openapi({
        description:
          "Optional title displayed above the image (plain_text only).",
      }),
    }),
    z.object({
      type: z.literal("header").openapi({
        description: "Header block - large text for visual hierarchy.",
      }),
      block_id: z.string().optional().openapi({
        description: "Unique block identifier",
        example: "hdr_789",
      }),
      text: TextBlockContent.openapi({
        description: "Header text content (plain_text only).",
      }),
    }),
    z.object({
      type: z.literal("divider").openapi({
        description: "Divider block - visual separator.",
      }),
      block_id: z.string().optional().openapi({
        description: "Unique block identifier",
        example: "div_012",
      }),
    }),
    // Add other common block types (e.g., actions, context) if needed
  ])
  .openapi({
    description:
      "A Slack Block Kit layout block. See https://api.slack.com/block-kit for types.",
    "x-tags": SLACK_TAGS,
  });

// Attachment Schema (Legacy)
const AttachmentSchema = z
  .object({
    color: z.string().optional().openapi({
      description: "Sidebar color (e.g., #36a64f or good/warning/danger).",
      example: "#439FE0",
    }),
    pretext: z.string().optional().openapi({
      description: "Optional text appearing above the main attachment block.",
      example: "New Report Available",
    }),
    text: z.string().optional().openapi({
      description: "Main text content of the attachment.",
      example: "Click the link to view the report.",
    }),
    title: z.string().optional().openapi({
      description: "Title text displayed as larger text.",
      example: "Q3 Sales Report",
    }),
    title_link: z.string().url().optional().openapi({
      description: "URL to hyperlink the title text.",
      example: "https://example.com/reports/q3",
    }),
    fields: z
      .array(
        z.object({
          title: z
            .string()
            .openapi({ description: "Field title.", example: "Region" }),
          value: z
            .string()
            .openapi({ description: "Field value.", example: "North America" }),
          short: z.boolean().optional().openapi({
            description: "Allow field to be displayed side-by-side.",
            example: true,
          }),
        }),
      )
      .optional()
      .openapi({ description: "Array of fields displayed in columns." }),
    // Add other attachment fields like footer, image_url, thumb_url if needed
  })
  .openapi({
    description: "Legacy Slack message attachment structure.",
    "x-tags": SLACK_TAGS,
  });

// --- Send Message Schemas ---

export const SendMessageRequestSchema = z
  .object({
    botToken: z.string().min(1).openapi({
      description: "Slack Bot User OAuth Token (starts with `xoxb-`).",
      example: "xoxb-your-bot-token-here-xxxxx",
    }),
    channel: z.string().min(1).openapi({
      description:
        "Channel ID (e.g., C12345) or User ID (e.g., U12345) to send message to.",
      example: "C0ABC123DEF",
    }),
    text: z.string().openapi({
      description: "Required plain text summary/fallback for the message.",
      example: "Hello from the API! See details in blocks.",
    }),
    thread_ts: z.string().optional().openapi({
      description:
        "Timestamp (`ts` value) of the parent message to reply in a thread.",
      example: "1629876543.001200",
    }),
    blocks: z.array(BlockSchema).optional().openapi({
      description:
        "Optional: Array of Block Kit components for rich formatting.",
    }),
    attachments: z.array(AttachmentSchema).optional().openapi({
      description: "Optional: Array of legacy secondary attachments.",
    }),
    // Add other chat.postMessage parameters like link_names, parse, etc. if needed
  })
  .openapi({
    description: "Request body for sending a Slack message.",
    "x-tags": SLACK_TAGS,
  });

export const SendMessageResultDataSchema = z
  .object({
    ok: z
      .boolean()
      .openapi({ description: "Indicates if the API call was successful." }),
    channel: z
      .string()
      .openapi({ description: "The channel ID where the message was sent." }),
    ts: z.string().openapi({
      description:
        "The timestamp of the sent message, acting as its unique ID.",
    }),
    // Note: We avoid .passthrough() here to encourage defining expected fields.
    // Add other known fields from chat.postMessage response if needed.
    // e.g., message: z.object({ ... }).optional()
  })
  // .passthrough() // Avoid passthrough unless strictly necessary for forward compatibility
  .openapi({
    description: "Core data returned after successfully sending a message.",
  });

// Standardized success response wrapper for sending a message
export const SendMessageResponseSchema = SuccessResponseSchema(
  SendMessageResultDataSchema,
);

// --- List Conversations Schemas ---

export const ListConversationsRequestSchema = z
  .object({
    botToken: z.string().openapi({ description: "Slack Bot User OAuth Token" }),
    // Add other potential parameters for conversations.list if needed (e.g., limit, cursor, types)
  })
  .openapi({ description: "Request body for listing Slack conversations." });

export const ConversationSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier for the conversation (channel ID).",
    }),
    name: z
      .string()
      .openapi({ description: "Name of the conversation (e.g., #general)." }),
    is_private: z
      .boolean()
      .openapi({ description: "Indicates if the conversation is private." }),
    is_im: z.boolean().openapi({
      description: "Indicates if the conversation is a direct message.",
    }),
    members: z.array(z.string()).optional().openapi({
      description:
        "List of member IDs (may not always be present depending on context/permissions).",
    }),
    // Add other relevant fields from conversations.list response like is_channel, is_group, created, creator, etc.
  })
  // .passthrough() // Avoid passthrough
  .openapi({
    description:
      "Represents a single Slack conversation (channel, DM, group DM).",
  });

export const ListConversationsResultDataSchema = z
  .object({
    conversations: z
      .array(ConversationSchema)
      .openapi({ description: "An array of conversation objects." }),
    // Add pagination details if needed (e.g., next_cursor from response_metadata)
    // next_cursor: z.string().optional().openapi({ description: "Cursor for pagination." })
  })
  // .passthrough() // Avoid passthrough
  .openapi({ description: "Core data containing the list of conversations." });

// Standardized success response wrapper for listing conversations
export const ListConversationsResponseSchema = SuccessResponseSchema(
  ListConversationsResultDataSchema,
);

// Note: ApiErrorResponseSchema is imported and used directly in OpenAPI definitions or controllers.
