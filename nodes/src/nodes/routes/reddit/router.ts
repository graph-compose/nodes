import express from "express";
import validate from "express-zod-safe";
import * as redditController from "./controllers/redditController";
import { createOpenApiDocument } from "./openapi";
import { RedditSearchRequestSchema } from "./schemas/redditSchemas";

const router = express.Router();

router.post(
  "/search",
  validate({ body: RedditSearchRequestSchema }),
  redditController.searchPosts,
);

router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    console.error(`[RedditRouter] Failed to generate OpenAPI document:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation.",
      error: {
        details: error instanceof Error ? error.message : String(error),
      },
    });
  }
});

export default router;
