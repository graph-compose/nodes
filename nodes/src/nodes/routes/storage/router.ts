import { Router } from "express";
import validate from "express-zod-safe";

// Import Schemas
import { GenerateGcsSignedUrlRequestSchema } from "./schemas/signedUrlSchemas";
import { TransferRequestSchema } from "./schemas/transferSchemas";
import { WriteContentRequestSchema } from "./schemas/writeSchemas";

// Import Controllers
import { generateSignedUrlController } from "./controllers/signedUrlController";
import { transferController } from "./controllers/transferController";
import { writeContentController } from "./controllers/writeController";

// Import OpenAPI generator
import { createOpenApiDocument } from "./openapi";

export const storageRouter = Router();

// --- OpenAPI Route ---
storageRouter.get("/openapi.json", async (_req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Expires", new Date(Date.now() + 3600000).toUTCString());
    return res.json(openApiDoc);
  } catch (error) {
    console.error("Error generating storage OpenAPI spec:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate API documentation",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// --- Feature Routes ---

// Transfer Route
storageRouter.post(
  "/transfer/url",
  validate({ body: TransferRequestSchema }),
  transferController,
);

// Write Route
storageRouter.post(
  "/write/content",
  validate({ body: WriteContentRequestSchema }),
  writeContentController,
);

// Generate Signed URL Route (New)
storageRouter.post(
  "/generate-signed-url",
  validate({ body: GenerateGcsSignedUrlRequestSchema }),
  generateSignedUrlController,
);

export default storageRouter;
