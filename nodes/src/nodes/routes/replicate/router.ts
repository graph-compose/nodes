import express from "express";
import validate from "express-zod-safe"; // Import validation middleware
import { createOpenApiDocument } from "./openapi";
// Import schemas for validation
import {
  CreatePredictionRequestSchema,
  GetPredictionStatusRequestSchema,
} from "./schemas/predictionSchemas";
// Import controllers
import {
  createPredictionController,
  getPredictionStatusController,
} from "./controllers/predictionController";

const router = express.Router();

// Route to create a prediction task, with validation middleware
router.post(
  "/predictions/create", // Define full relative path here
  validate({ body: CreatePredictionRequestSchema }),
  createPredictionController,
);

// Route to query the status of a prediction task, with validation middleware
router.post(
  "/predictions/status", // Define full relative path here
  validate({ body: GetPredictionStatusRequestSchema }),
  getPredictionStatusController,
);

// Endpoint to serve this module's OpenAPI documentation
// Keep path as /openapi.json as per standard for local docs
router.get("/openapi.json", (req, res) => {
  try {
    const doc = createOpenApiDocument();
    res.json(doc);
  } catch (error) {
    console.error("[Replicate Router] Error generating document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI document for Replicate",
      error: {
        details: error instanceof Error ? error.message : "Unknown error",
      }, // Use standard error format
    });
  }
});

// Export router to be used in the main index.ts
export const replicateRouter = router;
export default router; // Default export for convenience/compatibility

// No longer need to export createOpenApiDocument from here,
// it should be imported directly in the main index.ts if needed.
