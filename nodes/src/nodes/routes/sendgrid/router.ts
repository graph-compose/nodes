import { RequestHandler, Router } from "express";
import validate from "express-zod-safe"; // Assuming this is the validation middleware
import { z } from "zod"; // Import z
import { ApiErrorResponse, SuccessResponse } from "../../../types/api-response"; // Import response types
import * as sendgridController from "./controllers/sendgridController";
import { createOpenApiDocument } from "./openapi";
import {
  SendEmailRequestSchema,
  SendEmailResultDataSchema,
} from "./schemas/sendgridSchemas";

const sendgridRouter = Router();

// Standardized OpenAPI spec endpoint (Corrected to GET with error handling and caching)
sendgridRouter.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    // Add explicit cache control headers as per standard
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("Expires", new Date(Date.now() + 3600000).toUTCString());
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      "[SendGrid Router] Failed to generate OpenAPI document:",
      error,
    );
    // Use standard error structure
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation for SendGrid.",
      error: {
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

// Define the expected handler type explicitly
type SendEmailHandler = RequestHandler<
  Record<string, never>,
  SuccessResponse<z.infer<typeof SendEmailResultDataSchema>> | ApiErrorResponse,
  z.infer<typeof SendEmailRequestSchema>
>;

// Send email endpoint using the controller
sendgridRouter.post(
  "/send",
  validate({ body: SendEmailRequestSchema }), // Apply validation middleware
  sendgridController.sendEmail as SendEmailHandler, // Cast controller to the explicit type
);

export default sendgridRouter;
