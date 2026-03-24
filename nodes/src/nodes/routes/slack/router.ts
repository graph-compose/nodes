import express from "express";
// Use default import for validate based on linter feedback
import validate from "express-zod-safe";
import * as slackController from "./controllers/slackController";
import { createOpenApiDocument } from "./openapi"; // Import the doc generator
import {
  ListConversationsRequestSchema,
  SendMessageRequestSchema,
} from "./schemas/slackSchemas";

const router = express.Router();

// Define routes relative to the service base path (e.g., /slack)
// These paths will be prefixed with /nodes/slack globally

// POST /messages - Send a Slack message
router.post(
  "/messages",
  validate({ body: SendMessageRequestSchema }), // Validate request body
  slackController.sendMessage, // Call controller function
);

// POST /conversations - List Slack conversations
router.post(
  "/conversations",
  validate({ body: ListConversationsRequestSchema }), // Validate request body
  slackController.listConversations, // Call controller function
);

// Add the mandatory local OpenAPI endpoint
// POST /openapi.json - Returns the OpenAPI spec for this node
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    console.error(`[SlackRouter] Failed to generate OpenAPI document:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation for Slack node.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router; // Export router to be mounted in the main API router
