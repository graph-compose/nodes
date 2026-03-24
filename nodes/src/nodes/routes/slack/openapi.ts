import { createDocument } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response"; // Correct path for shared error schema
import {
  ListConversationsRequestSchema,
  ListConversationsResponseSchema,
  SendMessageRequestSchema,
  SendMessageResponseSchema,
} from "./schemas/slackSchemas";

// Common Tags
const SLACK_TAGS = ["Slack"];

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Slack Integration API",
      version: "1.0.1",
      description: `API for interacting with Slack: sending messages and listing conversations.\\n\\n## Authentication\\nRequires a Slack Bot User OAuth Token (\`botToken\`, starts with \`xoxb-\`) provided in the request body for all endpoints.`,
    },
    externalDocs: {
      description: "Slack API Documentation",
      url: "https://api.slack.com/methods",
    },
    paths: {
      // Path keys MUST include the service name prefix \`/slack\`
      "/slack/messages": {
        post: {
          summary: "Send a message to Slack",
          description: `Sends a message to a specified Slack channel or user ID.\\n\\n**Features:**\\n- Supports plain text (\`text\` field is required fallback).\\n- Supports rich formatting via Block Kit (\`blocks\` array).\\n- Supports legacy attachments (\`attachments\` array).\\n- Can reply within a thread using \`thread_ts\`.\\n\\n**Workflow:**\\n1. Provide \`botToken\`, \`channel\` (ID), and message content (\`text\`, \`blocks\`, or \`attachments\`).\\n2. API call uses Slack\'s \`chat.postMessage\` method.\\n3. Successful response (\`200 OK\`) includes channel ID and message timestamp (\`ts\`).`,
          tags: SLACK_TAGS,
          requestBody: {
            required: true,
            description:
              "Request body containing the bot token and message details.",
            content: {
              "application/json": {
                schema: SendMessageRequestSchema, // Reference the specific request schema
                example: {
                  botToken: "xoxb-your-valid-bot-token-here",
                  channel: "C123ABC456",
                  text: "Hello from the Nodes API! This is a fallback text.",
                  blocks: [
                    {
                      type: "section",
                      text: {
                        type: "mrkdwn",
                        text: "Hello from the *Nodes API*! This uses Block Kit.",
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Message sent successfully. Returns channel ID and timestamp (`ts`).",
              content: {
                "application/json": {
                  schema: SendMessageResponseSchema, // Reference the specific success response schema
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., missing channel/text, invalid Block Kit).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed (invalid `botToken`).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description: "Channel or user specified in `channel` not found.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or error communicating with the Slack API (e.g., `channel_not_found`, `invalid_auth`, `ratelimited`). Check message for Slack error code.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
      "/slack/conversations": {
        post: {
          summary: "List Slack Conversations",
          description: `Retrieves a list of conversations (channels, DMs, etc.) accessible by the provided Slack bot token.\n\n**Features:**\n- Lists public channels, private channels, multi-party DMs (MPIMs), and direct messages (IMs).\n- Supports pagination using \`limit\` and \`cursor\`.\n- Can filter by conversation \`types\`.\n\n**Workflow:**\n1. Provide \`botToken\`.\n2. Optionally provide \`limit\`, \`cursor\`, \`types\`.\n3. API call uses Slack\'s \`conversations.list\` method.\n4. Successful response (\`200 OK\`) includes an array of \`conversations\` and potentially a \`next_cursor\`.\n\n**Error Handling:**\n- Returns 500 on internal server errors or issues communicating with the Slack API.\n- Assumes 400 Bad Request errors are handled by upstream validation middleware.`, // Use full path
          tags: SLACK_TAGS,
          requestBody: {
            required: true,
            description:
              "Bot token and optional pagination/filtering parameters.",
            content: {
              "application/json": {
                schema: ListConversationsRequestSchema, // Reference request schema
                example: {
                  botToken: "xoxb-your-valid-bot-token-here",
                },
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Successfully retrieved the list of conversations.",
              content: {
                "application/json": {
                  schema: ListConversationsResponseSchema, // Reference success response schema
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., invalid `limit` or `types`).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description: "Authentication failed (invalid `botToken`).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or error communicating with the Slack API (e.g., `invalid_cursor`, `ratelimited`). Check message for Slack error code.",
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
    // Components schemas will be automatically generated by createDocument based on referenced schemas
    components: {
      // securitySchemes: { ... } // Define if needed
    },
  });

  // Add standard metadata
  return {
    ...document,
    meta: {
      // High-level tags for the node discovery
      tags: ["communication", "messaging", "collaboration", "chat", "slack"],
      provider: "Slack",
      category: "Communication", // Broader category
      // Use an official or recognizable Slack icon URL
      imageUrl:
        "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
      // Link to Slack API documentation
      sourceUrl: "https://api.slack.com/",
      // Consistent with info.description but maybe slightly more marketing-focused
      description:
        "Integrate with Slack to send messages and list conversations using the Slack Web API.\n\n**Key Features:**\n- Send messages using Block Kit or legacy attachments.\n- Reply in threads.\n- List various conversation types (public, private, DMs, MPIMs).\n- Supports pagination for conversation listing.\n\n**Use Cases:**\n- Sending notifications from workflows.\n- Automating status updates or reports.\n- Building simple Slack bots or integrations.\n- Retrieving channel lists for user selection.",
      features: [
        "Send messages (Block Kit/Attachments)",
        "Reply in Threads",
        "List Conversations (Public/Private/DM/MPIM)",
        "Conversation List Pagination & Filtering",
        "Bot Token Authentication",
      ],
      pricing: "Requires Slack plan (Free tier has limitations)",
      documentation: "https://api.slack.com/methods",
      support: "https://slack.com/help",
    },
  };
};
