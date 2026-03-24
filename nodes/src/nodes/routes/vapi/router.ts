import express from "express";
import validate from "express-zod-safe";
import * as callController from "./controllers/callController";
import { createOpenApiDocument } from "./openapi"; // Import the doc generator
import { CreateCallRequestSchema } from "./schemas/callSchemas";

const router = express.Router();

// Define route for creating a call
// Path is relative to /vapi (e.g., full path will be /nodes/vapi/call/create)
router.post(
  "/call/create",
  validate({ body: CreateCallRequestSchema }), // Validate request body against schema
  callController.handleCreateCall, // Call controller handler if validation passes
);

// Define the local OpenAPI documentation endpoint
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      `[VapiRouter] Failed to generate OpenAPI document for vapi:`,
      error,
    );
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation.",
    });
  }
});

export default router;
