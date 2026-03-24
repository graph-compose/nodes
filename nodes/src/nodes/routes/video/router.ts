import express from "express";
import validate from "express-zod-safe";

// Import Controllers
import { extractAudioController } from "./controllers/audioExtractionController";
import { clipController } from "./controllers/clipController";
import { concatenateVideosController } from "./controllers/concatenationController";
import { extractFramesController } from "./controllers/frameExtractionController";
import { replaceAudioController } from "./controllers/replaceAudioController";

// Import Request Schemas for Validation
import { AudioExtractionRequestSchema } from "./schemas/audioExtractionSchemas";
import { ClipRequestSchema } from "./schemas/clipSchemas";
import { VideoConcatenationRequestSchema } from "./schemas/concatenationSchemas";
import { FrameExtractionRequestSchema } from "./schemas/frameExtractionSchemas";
import { ReplaceAudioRequestSchema } from "./schemas/replaceAudioSchemas";

// Import OpenAPI Document Generator
import { createOpenApiDocument } from "./openapi";

const router = express.Router();

// Define routes with validation middleware
router.post(
  "/concat",
  validate({ body: VideoConcatenationRequestSchema }),
  concatenateVideosController,
);

router.post(
  "/audio-extraction",
  validate({ body: AudioExtractionRequestSchema }),
  extractAudioController,
);

router.post(
  "/frame-extraction",
  validate({ body: FrameExtractionRequestSchema }),
  extractFramesController,
);

router.post(
  "/clip",
  validate({ body: ClipRequestSchema }),
  clipController,
);

router.post(
  "/replace-audio",
  validate({ body: ReplaceAudioRequestSchema }),
  replaceAudioController,
);

// Add local OpenAPI endpoint for the entire node
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument(); // Call the combined generator
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("Expires", new Date(Date.now() + 3600000).toUTCString());
    res.json(openApiDoc);
  } catch (error) {
    console.error(`[Video Router] Failed to generate OpenAPI document:`, error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate documentation." });
  }
});

export default router;
