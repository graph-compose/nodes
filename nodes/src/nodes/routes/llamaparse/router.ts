import express from "express";
import validate from "express-zod-safe";
import * as parseController from "./controllers/parseController";
import { createOpenApiDocument } from "./openapi";

// Import request schemas (These will be refined/defined in the next step)
import {
  CreateParseJobRequestSchema, // To be defined for POST body
  GetParseJobResultRequestSchema,
  GetParseJobStatusRequestSchema, // To be defined for POST body
} from "./schemas/schema";

const router = express.Router();

// --- Define routes relative to the service base path (/llamaparse) ---

// POST /parse - Start a new parsing job (Renamed from /create)
router.post(
  "/parse", // Updated path
  validate({ body: CreateParseJobRequestSchema }), // Validate request body
  parseController.createParseJobController, // Route to controller
);

// POST /status - Check the status of a job (Changed from GET w/ param)
router.post(
  "/status",
  validate({ body: GetParseJobStatusRequestSchema }), // Validate request body
  parseController.getParseJobStatusController,
);

// POST /result - Get the result of a completed job (Changed from GET w/ param)
router.post(
  "/result",
  validate({ body: GetParseJobResultRequestSchema }), // Validate request body
  parseController.getParseJobResultController,
);

// --- Local OpenAPI Endpoint --- Requirement from ROUTE_STANDARDS.md
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      `[LlamaParse Router] Failed to generate OpenAPI document for llamaparse:`,
      error,
    );
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation.",
      error: {
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

export default router; // Export the router for mounting in the main API router
