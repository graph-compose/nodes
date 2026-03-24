import express from "express";
import * as emailController from "./controllers/emailController";
import { createOpenApiDocument } from "./openapi";
// Import { SendEmailRequestSchema } from './schemas/emailSchemas'; // Schema for validation
// Import { validate } from 'express-zod-safe'; // Validation middleware (skipped as requested)

const router = express.Router();

// Define the route for sending email (relative path)
// Validation middleware would typically go here:
// router.post('/email/send', validate({ body: SendEmailRequestSchema }), emailController.sendEmailController);
router.post("/email/send", emailController.sendEmailController);

// Define the mandatory local OpenAPI endpoint
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      `[Router] Failed to generate OpenAPI document for resend:`,
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

export default router;
