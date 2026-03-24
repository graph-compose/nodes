import express from "express";
import validate from "express-zod-safe";
import * as serpapiController from "./controllers/serpapiController";
import { createOpenApiDocument } from "./openapi";
import { SerpApiSearchRequestSchema } from "./schemas/serpapiSchemas";

const router = express.Router();

router.post(
  "/search",
  validate({ body: SerpApiSearchRequestSchema }),
  serpapiController.search,
);

router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation.",
      data: null,
      error: {
        details: error instanceof Error ? error.message : String(error),
      },
    });
  }
});

export default router;
