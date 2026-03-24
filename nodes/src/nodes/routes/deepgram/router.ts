import express from "express";
import validate from "express-zod-safe"; // Assuming this middleware is available
import { speakController } from "./controllers/speakController";
import { transcribeUrlController } from "./controllers/transcribeController"; // Import new controller
import { createOpenApiDocument } from "./openapi";
import { SpeakRequestSchema } from "./schemas/speakSchemas";
import { TranscribeUrlRequestSchema } from "./schemas/transcribeSchemas"; // Import new schema

const router = express.Router();

// Define the route, applying validation middleware and pointing to the controller
router.post(
  "/speak", // Path relative to the service base (/deepgram)
  validate({ body: SpeakRequestSchema }), // Validate request body
  speakController, // Handle the request
);

// --- Speech-to-Text (URL) --- //
router.post(
  "/transcribe/url",
  validate({ body: TranscribeUrlRequestSchema }), // Validate request body
  transcribeUrlController,
);

// Add the standard OpenAPI documentation endpoint for this node
// Uses POST as per the ROUTE_STANDARDS.md (section 5.2)
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      "[Deepgram Router] Failed to generate OpenAPI document:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation for Deepgram.",
    });
  }
});

// Export the router to be mounted by the main API router
export { createOpenApiDocument }; // Also export the doc generator if needed elsewhere
export default router;
