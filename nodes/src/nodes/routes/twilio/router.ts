import express from "express";
import validate from "express-zod-safe"; // Import validation middleware
import * as messageController from "./controllers/messageController";
import { createOpenApiDocument } from "./openapi";
import { SendSmsRequestSchema } from "./schemas/twilioSchemas"; // Import schema for validation
const router = express.Router();

// --- Routes --- (Relative paths to the service base /twilio)

// POST /sms/send - Send an SMS message
router.post(
  "/sms/send",
  validate({ body: SendSmsRequestSchema }), // Validate request body against the schema
  messageController.sendMessage, // Route to the controller function
);
-
// POST /openapi.json - Local OpenAPI specification endpoint
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument(); // Call the generator function
    res.json(openApiDoc); // Return the generated document
  } catch (error) {
    console.error(`[TwilioRouter] Failed to generate OpenAPI document:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation.",
      error: {
        details: error instanceof Error ? error.message : String(error),
      },
    });
  }
});

export default router; // Export the router for the main app to use
