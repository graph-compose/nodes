import {
  CodedError,
  ErrorCode,
  WebAPICallResult,
  WebClient,
  WebClientOptions,
} from "@slack/web-api";
import { z } from "zod";
import {
  ConversationSchema,
  SendMessageRequestSchema,
  SendMessageResultDataSchema,
} from "../schemas/slackSchemas";

// Define stricter types for expected API responses
interface SendMessageSuccessResult extends WebAPICallResult {
  ok: true;
  channel: string;
  ts: string;
  // Potentially add other expected fields like 'message'
}

interface ConversationsListSuccessResult extends WebAPICallResult {
  ok: true;
  channels: z.infer<typeof ConversationSchema>[]; // Expect an array of validated conversation objects
  // Include response_metadata if pagination is handled
  // response_metadata?: { next_cursor?: string };
}

/**
 * Service class for interacting with the Slack API
 */
export class SlackService {
  private client: WebClient;

  constructor(botToken: string, options?: WebClientOptions) {
    this.client = new WebClient(botToken, options);
  }

  /**
   * Send a message to a Slack channel
   * @throws {Error} If the API call fails or returns an error
   */
  async sendMessage(
    message: z.infer<typeof SendMessageRequestSchema>,
  ): Promise<z.infer<typeof SendMessageResultDataSchema>> {
    try {
      const response = (await this.client.chat.postMessage({
        channel: message.channel,
        text: message.text,
        thread_ts: message.thread_ts,
        blocks: message.blocks,
        attachments: message.attachments,
      })) as SendMessageSuccessResult; // Type assertion for success

      if (!response.ok) {
        // This case should ideally be caught by the catch block, but handle defensively
        throw new Error("Slack API returned ok: false unexpectedly.");
      }

      // Validate and return the core success data
      // We trust the Slack SDK types to a degree but can re-validate if needed
      return {
        ok: response.ok,
        channel: response.channel,
        ts: response.ts,
      };
    } catch (error: unknown) {
      console.error("[SlackService] Error sending message:", error);
      if ((error as CodedError)?.code === ErrorCode.PlatformError) {
        const platformError = error as CodedError & { data: WebAPICallResult };
        // Throw a more specific error using the message from Slack's platform error
        throw new Error(
          `Slack API Error: ${
            platformError.data?.error || "Unknown platform error"
          }`,
        );
      } else if (error instanceof Error) {
        // Re-throw other standard errors
        throw error;
      }
      // Throw a generic error for unknown types
      throw new Error(
        "An unknown error occurred while sending the Slack message.",
      );
    }
  }

  /**
   * List conversations (channels) in the workspace
   * @throws {Error} If the API call fails or returns an error
   */
  async listConversations(): Promise<z.infer<typeof ConversationSchema>[]> {
    try {
      // Add necessary parameters like 'types' if you need more than public channels
      const response = (await this.client.conversations.list({
        // limit: 100, // Example: Add limit for pagination
        types: "public_channel,private_channel,mpim,im", // Fetch all types
      })) as ConversationsListSuccessResult;

      if (!response.ok) {
        throw new Error(
          "Slack API returned ok: false unexpectedly when listing conversations.",
        );
      }

      // Validate each channel against the Zod schema before returning
      const validatedConversations = response.channels.map(
        (channel) => ConversationSchema.parse(channel), // This will throw if a channel doesn't match the schema
      );

      return validatedConversations;
    } catch (error: unknown) {
      console.error("[SlackService] Error listing conversations:", error);
      if ((error as CodedError)?.code === ErrorCode.PlatformError) {
        const platformError = error as CodedError & { data: WebAPICallResult };
        throw new Error(
          `Slack API Error: ${
            platformError.data?.error || "Unknown platform error"
          }`,
        );
      } else if (error instanceof z.ZodError) {
        // Handle potential validation errors during parsing
        throw new Error(
          `Conversation data validation failed: ${error.errors
            .map((e) => e.message)
            .join(", ")}`,
        );
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        "An unknown error occurred while listing Slack conversations.",
      );
    }
  }
}

// Export a factory function instead of a singleton instance
// This ensures a new client is created per request (using the token from the request)
export const createSlackService = (botToken: string) =>
  new SlackService(botToken);
