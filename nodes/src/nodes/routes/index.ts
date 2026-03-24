import express from "express";
import "zod-openapi/extend";
import audioRouter from "./audio/router";
import creatifyRouter from "./creatify/router";
import deepgramRouter from "./deepgram/router";
import destinationsRouter from "./destinations";
import elevenLabsRouter from "./elevenlabs/router";
import firecrawlRouter from "./firecrawl";
import klingaiRouter from "./klingai/router";
import { llamaparseRouter } from "./llamaparse";
import lumaRouter from "./luma/router";
import openaiRouter from "./openai/router";
import pixverseRouter from "./pixverse/router";
import { replicateRouter } from "./replicate/router";
import redditRouter from "./reddit/router";
import resendRouter from "./resend/router";
import runwayRouter from "./runway/index";
import sendgridRouter from "./sendgrid/router";
import serpapiRouter from "./serpapi/router";
import slackRouter from "./slack/router";
import sourcesRouter from "./sources";
import storageRouter from "./storage/router";
import textRouter from "./text/router";
import twilioRouter from "./twilio/router";
import vapiRouter from "./vapi/router";
import videoRouter from "./video/router";

import {
  collectOpenApiDocuments,
  generateMergedOpenApiDocument,
} from "../../docs";
import { cleanPath, getRoutes } from "../../utils/expose-routes";

export const apiRouter = express.Router();

// Strip /nodes prefix if it exists
apiRouter.use((req, res, next) => {
  if (req.path.startsWith("/nodes/")) {
    req.url = req.url.replace("/nodes/", "/");
  }
  next();
});

// Type for simplified route information
interface SimpleRouteInfo {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  meta?: {
    imageUrl?: string;
    tags?: string[];
    category?: string;
    sourceUrl?: string;
  };
}

// Mount routers
apiRouter.use("/audio", audioRouter);
apiRouter.use("/text", textRouter);
apiRouter.use("/luma", lumaRouter);
apiRouter.use("/runway", runwayRouter);
apiRouter.use("/video", videoRouter);
apiRouter.use("/sendgrid", sendgridRouter);
apiRouter.use("/slack", slackRouter);
apiRouter.use("/klingai", klingaiRouter);
// Intentionally mounted but excluded from merged discovery/OpenAPI indexing.
// These are workflow runtime primitives, not surfaced hosted-node integrations.
apiRouter.use("/sources", sourcesRouter);
apiRouter.use("/destinations", destinationsRouter);
apiRouter.use("/firecrawl", firecrawlRouter);
apiRouter.use("/twilio", twilioRouter);
apiRouter.use("/elevenlabs", elevenLabsRouter);
apiRouter.use("/openai", openaiRouter);
apiRouter.use("/storage", storageRouter);
apiRouter.use("/reddit", redditRouter);
apiRouter.use("/resend", resendRouter);
apiRouter.use("/serpapi", serpapiRouter);
apiRouter.use("/creatify", creatifyRouter);
apiRouter.use("/deepgram", deepgramRouter);
apiRouter.use("/replicate", replicateRouter);
apiRouter.use("/llamaparse", llamaparseRouter);
apiRouter.use("/pixverse", pixverseRouter);

// --- Mount Vapi Router ---
apiRouter.use("/vapi", vapiRouter);
// --- End Mount Vapi Router ---

// Routes discovery endpoint
apiRouter.get("/routes", (req, res) => {
  const routes = getRoutes(apiRouter, "/nodes");
  const cleanedRoutes = routes.map(route => ({
    ...route,
    path: cleanPath(route.path),
  }));
  res.json({ routes: cleanedRoutes });
});

// Simplified routes documentation endpoint
apiRouter.get("/routes-info", async (req, res) => {
  const documents = await collectOpenApiDocuments();

  const routes: SimpleRouteInfo[] = [];
  const seenPaths = new Set<string>(); // Track unique path+method combinations

  // Helper to normalize paths for comparison
  const normalizePath = (path: string): string => {
    return path
      .replace(/^\/nodes\//, "") // Remove /nodes/ prefix
      .replace(/^\/api\//, "") // Remove /api/ prefix
      .toLowerCase(); // Case insensitive comparison
  };

  // Collect simplified route information from all documents
  documents.forEach(doc => {
    Object.entries(doc.paths || {}).forEach(([path, methods]) => {
      const cleanPath = "/nodes" + path.replace(/^\/api/, "");

      Object.entries(methods).forEach(([method, operation]) => {
        const normalizedPath = normalizePath(cleanPath);
        const pathMethodKey = `${normalizedPath}:${method.toLowerCase()}`;

        // Skip if we've already seen this path+method combination
        if (seenPaths.has(pathMethodKey)) {
          return;
        }

        routes.push({
          path: cleanPath,
          method: method.toUpperCase(),
          summary: operation.summary,
          description: operation.description,
        });

        seenPaths.add(pathMethodKey);
      });
    });
  });

  // Sort routes for consistent ordering
  routes.sort((a, b) => a.path.localeCompare(b.path));

  res.json({ routes });
});

// Endpoint to serve the merged OpenAPI documentation
apiRouter.get("/openapi.json", async (req, res) => {
  try {
    // Dynamically determine the server URL based on the request
    const baseUrl =
      process.env.NODES_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://nodes.graphcompose.io"
        : `${req.protocol}://${req.get("host")}`);

    const mergedDoc = await generateMergedOpenApiDocument(baseUrl);
    res.json(mergedDoc);
  } catch (error) {
    console.error("Failed to generate merged OpenAPI document:", error);
    res.status(500).json({ error: "Failed to generate OpenAPI document" });
  }
});

export default apiRouter;
