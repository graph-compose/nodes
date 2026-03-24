import express from "express";
import validate from "express-zod-safe"; // Use validate from express-zod-safe
import * as creatifyController from "./controllers/creatifyController";
import { createOpenApiDocument } from "./openapi";
import {
  CreateMultiLipsyncRequestSchema,
  CreateSingleLipsyncRequestSchema,
  QueryTaskRequestSchema,
} from "./schemas/creatifySchemas";

const router = express.Router();

// === Creatify Routes === // Renamed section slightly

// POST /creatify/create (Path relative to base /nodes/creatify)
router.post(
  "/create", // Path updated
  validate({ body: CreateSingleLipsyncRequestSchema }), // Original validation call
  creatifyController.handleCreateSingleAvatarVideo, // Updated controller call
);

// POST /creatify/multi-avatar/create
router.post(
  "/multi-avatar/create", // Path updated
  validate({ body: CreateMultiLipsyncRequestSchema }), // Original validation call
  creatifyController.handleCreateMultiAvatarVideo, // Updated controller call
);

// POST /creatify/status
router.post(
  "/status", // Path updated
  validate({ body: QueryTaskRequestSchema }), // Original validation call
  creatifyController.handleQueryTaskStatus, // Original controller call
);

// === OpenAPI Documentation Route ===

// GET /creatify/openapi.json (as per ROUTE_STANDARDS.md) - Changed from POST to GET
router.get("/openapi.json", (req, res) => {
  // Restored original route
  try {
    const openApiDoc = createOpenApiDocument();
    // Add explicit cache control headers
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("Expires", new Date(Date.now() + 3600000).toUTCString());
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      "[Creatify Router] Failed to generate OpenAPI document:",
      error,
    );
    // Using a simple error response structure here
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error generating OpenAPI doc";
    res.status(500).json({
      message: "Failed to generate OpenAPI documentation for Creatify.",
      error: errorMessage,
    });
  }
});

export default router; // Export the router for mounting in the main app
