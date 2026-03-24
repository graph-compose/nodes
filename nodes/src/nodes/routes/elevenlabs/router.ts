import express from "express";
import validate from "express-zod-safe";
// import multer from "multer"; // Remove multer import
import * as elevenlabsController from "./controllers/elevenlabsController";
import { createOpenApiDocument } from "./openapi";
import {
  SoundEffectsRequestSchema,
  TextToSpeechRequestSchema,
  VoiceChangerUrlRequestSchema, // Import the new schema
} from "./schemas/elevenlabsSchemas";

const router = express.Router();

// Remove multer configuration
// const storage = multer.memoryStorage();
// const upload = multer({
//  storage: storage,
//  limits: { fileSize: 50 * 1024 * 1024 },
// });

// === Text-to-Speech Route ===
router.post(
  "/tts/generate",
  validate({ body: TextToSpeechRequestSchema }),
  elevenlabsController.handleTextToSpeech,
);

// === Sound Effects Route ===
router.post(
  "/sfx/generate",
  validate({ body: SoundEffectsRequestSchema }),
  elevenlabsController.handleSoundEffects,
);

// === Voice Changer Route (Updated) ===
// Now uses standard JSON body validation
router.post(
  "/voice-changer/convert",
  validate({ body: VoiceChangerUrlRequestSchema }), // Validate JSON body using the new schema
  // upload.single("audioFile"), // Remove multer middleware
  elevenlabsController.handleVoiceChanger, // Controller needs to be updated
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
      "[ElevenLabs Router] Failed to generate OpenAPI document:",
      error,
    );
    // Use a standard error structure (can reuse ApiErrorResponseSchema logic)
    const errorPayload = {
      success: false,
      message: "Failed to generate OpenAPI documentation for ElevenLabs.",
      error: {
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
    res.status(500).json(errorPayload);
  }
});

export default router; // Export the router for mounting
