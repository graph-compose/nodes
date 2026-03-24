import { Router } from "express";
import validate from "express-zod-safe";
import * as imageController from "./controllers/imageController";
import * as videoController from "./controllers/videoController";
import { createOpenApiDocument } from "./openapi"; // Import the doc generator
import { GenerateImageRequestSchema } from "./schemas/imageSchemas";
import {
  QueryTaskRequestSchema, // Generic query schema used for both image and video
} from "./schemas/sharedSchemas";
import {
  GenerateVideoExtensionRequestSchema,
  GenerateVideoFromImageRequestSchema,
  GenerateVideoFromTextRequestSchema,
} from "./schemas/videoSchemas";

const klingaiRouter = Router();

console.log("[KlingAI Router] Initializing...");

// --- Image Routes ---

klingaiRouter.post(
  "/image/generate",
  validate({ body: GenerateImageRequestSchema }),
  imageController.generateImageHandler,
);

klingaiRouter.post(
  "/image/task/status",
  validate({ body: QueryTaskRequestSchema }), // Use generic task query schema
  imageController.queryImageTaskHandler,
);

// --- Video Routes ---

klingaiRouter.post(
  "/video/text-to-video",
  validate({ body: GenerateVideoFromTextRequestSchema }),
  videoController.generateVideoFromTextHandler,
);

klingaiRouter.post(
  "/video/image-to-video",
  validate({ body: GenerateVideoFromImageRequestSchema }),
  videoController.generateVideoFromImageHandler,
);

klingaiRouter.post(
  "/video/extension",
  validate({ body: GenerateVideoExtensionRequestSchema }),
  videoController.generateVideoExtensionHandler,
);

// --- Video Task Status Routes ---
klingaiRouter.post(
  "/video/text-to-video/task/status", // Specific Path
  validate({ body: QueryTaskRequestSchema }),
  videoController.queryTextToVideoTaskHandler, // Specific Handler
);
klingaiRouter.post(
  "/video/image-to-video/task/status", // Specific Path
  validate({ body: QueryTaskRequestSchema }),
  videoController.queryImageToVideoTaskHandler, // Specific Handler
);
klingaiRouter.post(
  "/video/extension/task/status", // Specific Path
  validate({ body: QueryTaskRequestSchema }),
  videoController.queryVideoExtensionTaskHandler, // Specific Handler
);

// --- OpenAPI Endpoint ---

klingaiRouter.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    // Add standard cache control headers
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("Expires", new Date(Date.now() + 3600000).toUTCString());
    console.log("[KlingAI Router] Serving OpenAPI spec.");
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      `[KlingAI Router] Failed to generate or serve OpenAPI document:`,
      error,
    );
    // Use standard error structure
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation for Kling AI.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error generating OpenAPI spec.",
    });
  }
});

console.log("[KlingAI Router] Initialization complete. Routes registered.");

export default klingaiRouter;
