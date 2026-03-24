import express from "express";
import validate from "express-zod-safe";
import { concatController } from "./controllers/concatController";
import { AudioConcatRequestSchema, createOpenApiDocument } from "./schemas/concatSchemas";

const router = express.Router();

router.post("/concat", validate({ body: AudioConcatRequestSchema }), concatController);

router.get("/openapi.json", (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(createOpenApiDocument());
  } catch (error) {
    console.error("[Audio Router] Failed to generate OpenAPI document:", error);
    res.status(500).json({ success: false, message: "Failed to generate documentation." });
  }
});

export default router;
