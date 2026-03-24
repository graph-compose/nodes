import express from "express";
import validate from "express-zod-safe";
import * as firecrawlController from "./controllers/firecrawlController";
import { createOpenApiDocument } from "./openapi";
import { ScrapeRequestSchema } from "./schemas/firecrawlSchemas";

const router = express.Router();

console.log("[Firecrawl Router] Initializing...");

// === Scrape Route ===
router.post(
  "/scrape", // Path relative to the service base (/firecrawl)
  validate({ body: ScrapeRequestSchema }), // Middleware for request body validation
  firecrawlController.handleScrape, // Controller handler
);

// === OpenAPI Documentation Route ===
router.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    // Add explicit cache control headers
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("Expires", new Date(Date.now() + 3600000).toUTCString());
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      "[Firecrawl Router] Failed to generate OpenAPI document:",
      error,
    );
    // Use a standard error structure
    const errorPayload = {
      success: false,
      message: "Failed to generate OpenAPI documentation for Firecrawl.",
      error: {
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
    res.status(500).json(errorPayload);
  }
});

console.log("[Firecrawl Router] Routes initialized.");

export default router; // Export the router for mounting
