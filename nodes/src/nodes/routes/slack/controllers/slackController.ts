import { Request, Response } from "express";
import { z } from "zod";
import { ApiErrorResponseSchema } from "../../../../types/api-response"; // Corrected path
import {
  ListConversationsRequestSchema,
  ListConversationsResponseSchema,
  SendMessageRequestSchema,
  SendMessageResponseSchema,
} from "../schemas/slackSchemas";
import { createSlackService } from "../services/slackService";

/**
 * Controller for sending a message via Slack.
 * Assumes request body has been validated by middleware.
 */
export const sendMessage = async (
  // Use Record<string, never> for empty route params
  req: Request<
    Record<string, never>,
    z.infer<typeof SendMessageResponseSchema>,
    z.infer<typeof SendMessageRequestSchema>
  >,
  res: Response<
    | z.infer<typeof SendMessageResponseSchema>
    | z.infer<typeof ApiErrorResponseSchema>
  >,
) => {
  try {
    // Input is already validated by middleware (assumed)
    const messageData = req.body;
    const { botToken, ...messagePayload } = messageData;

    const service = createSlackService(botToken);
    // Pass only the relevant payload, not the token
    const result = await service.sendMessage(messagePayload as any); // Cast needed as botToken was extracted

    // Use the standard SuccessResponseSchema wrapper
    const response: z.infer<typeof SendMessageResponseSchema> = {
      success: true,
      data: result,
      message: "Message sent successfully",
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    console.error("[SlackController] Error sending message:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    // Use the standard ApiErrorResponseSchema
    const errorResponse: z.infer<typeof ApiErrorResponseSchema> = {
      success: false,
      message: errorMessage || "Failed to send Slack message.",
      data: null,
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Controller for listing Slack conversations.
 * Assumes request body has been validated by middleware.
 */
export const listConversations = async (
  // Use Record<string, never> for empty route params
  req: Request<
    Record<string, never>,
    z.infer<typeof ListConversationsResponseSchema>,
    z.infer<typeof ListConversationsRequestSchema>
  >,
  res: Response<
    | z.infer<typeof ListConversationsResponseSchema>
    | z.infer<typeof ApiErrorResponseSchema>
  >,
) => {
  try {
    // Input is already validated by middleware (assumed)
    const { botToken } = req.body;

    const service = createSlackService(botToken);
    const conversations = await service.listConversations();

    // Use the standard SuccessResponseSchema wrapper
    const response: z.infer<typeof ListConversationsResponseSchema> = {
      success: true,
      data: { conversations }, // Structure matches ListConversationsResultDataSchema
      message: "Successfully listed Slack conversations",
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    console.error("[SlackController] Error listing conversations:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    // Use the standard ApiErrorResponseSchema
    const errorResponse: z.infer<typeof ApiErrorResponseSchema> = {
      success: false,
      message: errorMessage || "Failed to list Slack conversations.",
      data: null,
    };

    res.status(500).json(errorResponse);
  }
};
