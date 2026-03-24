import express from "express";
import validate from "express-zod-safe"; // Use default import for express-zod-safe
import * as runwayController from "./controllers/runwayController";
import { createOpenApiDocument } from "./openapi"; // Import the doc generator
import {
  GenerateVideoRequestBodySchema,
  TaskActionParamsSchema,
  TaskActionRequestBodySchema,
} from "./schemas/requestSchemas"; // Import schemas for validation

const router = express.Router();

// Define routes relative to the service base path (/runway)

// POST /generate
router.post(
  "/generate",
  // Validate request body against the schema
  validate({ body: GenerateVideoRequestBodySchema }),
  runwayController.generateVideo,
);

// POST /status/:id
router.post(
  "/status/:id",
  // Validate URL parameters and request body
  validate({
    params: TaskActionParamsSchema,
    body: TaskActionRequestBodySchema,
  }),
  runwayController.getStatus,
);

// POST /cancel/:id
router.post(
  "/cancel/:id",
  // Validate URL parameters and request body
  validate({
    params: TaskActionParamsSchema,
    body: TaskActionRequestBodySchema,
  }),
  runwayController.cancelTask,
);

// POST /openapi.json - Local OpenAPI spec endpoint
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error: unknown) {
    console.error(`[RunwayRouter] Failed to generate OpenAPI document:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation.",
      error: {
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

export default router; // Export router to be mounted in the main API router
