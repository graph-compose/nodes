import express from "express";
import validate from "express-zod-safe";

// Import Schemas for validation
import { TranscribeSpeechRequestSchema } from "./schemas/speechSchemas";
import { AnalyzeImageRequestSchema } from "./schemas/visionSchemas";

// Import Controllers
import * as speechController from "./controllers/speechController";
import * as visionController from "./controllers/visionController";

// Import OpenAPI document generator
// Note: ./openapi.ts will be created in the next step
import { createOpenApiDocument } from "./openapi";

const router = express.Router();

// --- Vision Routes --- (Relative path: /vision/analyze-image)
router.post(
  "/vision/analyze-image",
  validate({ body: AnalyzeImageRequestSchema }),
  visionController.analyzeImageController,
);

// --- Speech-to-Text Routes --- (Relative path: /speech/transcribe)
router.post(
  "/speech/transcribe",
  validate({ body: TranscribeSpeechRequestSchema }),
  speechController.transcribeSpeechController,
);

// --- OpenAPI Endpoint --- (Relative path: /openapi.json)
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument(); // This function will be defined in openapi.ts
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      `[OpenAI Router] Failed to generate OpenAPI document:`,
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
