import express from "express";
import validate from "express-zod-safe";
// Remove Fastify and auth imports if not used elsewhere in this file
// import { FastifyInstance } from "fastify";
// import { authenticate } from "../../auth";

// Import Schemas for validation
import {
  // Image Schemas
  CreateImageGenerationRequestSchema,
  // Video Schemas
  CreateVideoGenerationRequestSchema,
  GetImageGenerationBodySchema,
  GetImageGenerationParamsSchema,
  GetVideoGenerationBodySchema,
  GetVideoGenerationParamsSchema,
} from "./schemas/lumaSchemas";

// Import Controllers
import * as imageController from "./controllers/imageController";
import * as videoController from "./controllers/videoController";

// Import OpenAPI document generator
import { createOpenApiDocument } from "./openapi"; // Corrected: Removed LumaOpenApi if not used directly

const router = express.Router();

// --- Image Routes --- (Relative paths, e.g., /images/generate)

router.post(
  "/images/generate",
  validate({ body: CreateImageGenerationRequestSchema }),
  imageController.createImageGenerationController,
);

router.post(
  "/images/status/:id",
  validate({
    params: GetImageGenerationParamsSchema,
    body: GetImageGenerationBodySchema,
  }),
  imageController.getImageGenerationStatusController,
);

/* Removed List Image Generations Route
router.post(
  "/images/list",
  validate({
    query: ListImageGenerationsRequestSchema, // Validate query params
    body: ListImageGenerationsBodySchema, // Validate body for apiKey
  }),
  imageController.listImageGenerationsController,
);
*/

// --- Video Routes --- (Relative paths, e.g., /videos/generate)

router.post(
  "/videos/generate",
  validate({ body: CreateVideoGenerationRequestSchema }),
  videoController.createVideoGenerationController,
);

router.post(
  "/videos/status/:id",
  validate({
    params: GetVideoGenerationParamsSchema,
    body: GetVideoGenerationBodySchema,
  }),
  videoController.getVideoGenerationStatusController,
);

/* Removed List Video Generations Route
router.post(
  "/videos/list",
  validate({
    query: ListVideoGenerationsRequestSchema, // Validate query params
    body: ListVideoGenerationsBodySchema, // Validate body for apiKey
  }),
  videoController.listVideoGenerationsController,
);
*/

// --- OpenAPI Endpoint --- (Relative path)

router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    console.error(`[Luma Router] Failed to generate OpenAPI document:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation.",
      error: {
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

// Remove the Fastify export block if it's not needed
/*
export default async function (fastify: FastifyInstance) {
  // ... (rest of the Fastify block)
}
*/

// Use the original Express export
export default router;
