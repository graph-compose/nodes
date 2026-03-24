import express from "express";
import validate from "express-zod-safe";
import { chunkController } from "./controllers/chunkController";
import { ChunkTextRequestSchema } from "./schemas/chunkSchemas";
import { createOpenApiDocument } from "./schemas/chunkSchemas";

const router = express.Router();

router.post("/chunk", validate({ body: ChunkTextRequestSchema }), chunkController);

router.get("/openapi.json", (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(createOpenApiDocument());
  } catch (error) {
    console.error("[Text Router] Failed to generate OpenAPI document:", error);
    res.status(500).json({ success: false, message: "Failed to generate documentation." });
  }
});

export default router;
