import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  AudioResultDataSchema,
  SoundEffectsRequestSchema,
  SuccessResponseSchema,
  TextToSpeechRequestSchema,
  VoiceChangerUrlRequestSchema,
} from "../schemas/elevenlabsSchemas";
import { ElevenLabsService } from "../services/elevenlabsService";

// Instantiate the service
const elevenLabsService = new ElevenLabsService();

// Define inferred types from Zod schemas for request bodies
type TextToSpeechRequest = z.infer<typeof TextToSpeechRequestSchema>;
type SoundEffectsRequest = z.infer<typeof SoundEffectsRequestSchema>;
type VoiceChangerUrlRequest = z.infer<typeof VoiceChangerUrlRequestSchema>;

// Define type for successful audio response data
type AudioResult = z.infer<typeof AudioResultDataSchema>;

/**
 * Controller for handling Text-to-Speech requests.
 */
export async function handleTextToSpeech(
  req: Request<Record<string, never>, any, TextToSpeechRequest>,
  res: Response,
) {
  console.log("[ElevenLabsController] Received request for Text-to-Speech");
  try {
    const { apiKey, text, voiceId, ...options } = req.body;
    const result: AudioResult = await elevenLabsService.generateSpeech(
      apiKey,
      text,
      voiceId,
      options,
    );
    const responsePayload = SuccessResponseSchema(AudioResultDataSchema).parse({
      success: true,
      message: null,
      data: result,
    });
    console.log("[ElevenLabsController] TTS successful, sending response");
    res.json(responsePayload);
  } catch (error: unknown) {
    console.error("[ElevenLabsController] Error in handleTextToSpeech:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during speech generation.";
    const errorPayload = {
      success: false,
      message: "Failed to generate speech from text.",
      data: null,
      error: { details: errorMessage },
    };
    const parsedError = ApiErrorResponseSchema.safeParse(errorPayload);

    if (!parsedError.success) {
      console.error(
        "[ElevenLabsController] Failed to parse standard error response:",
        parsedError.error,
      );
      res.status(500).json({
        success: false,
        message:
          "An internal error occurred, and error details could not be formatted.",
      });
    } else {
      res.status(500).json(parsedError.data);
    }
  }
}

/**
 * Controller for handling Sound Effects generation requests.
 */
export async function handleSoundEffects(
  req: Request<Record<string, never>, any, SoundEffectsRequest>,
  res: Response,
) {
  console.log("[ElevenLabsController] Received request for Sound Effects");
  try {
    const { apiKey, text, ...options } = req.body;
    const result: AudioResult = await elevenLabsService.generateSoundEffect(
      apiKey,
      text,
      options,
    );
    const responsePayload = SuccessResponseSchema(AudioResultDataSchema).parse({
      success: true,
      message: null,
      data: result,
    });
    console.log("[ElevenLabsController] SFX successful, sending response");
    res.json(responsePayload);
  } catch (error: unknown) {
    console.error("[ElevenLabsController] Error in handleSoundEffects:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during sound effect generation.";
    const errorPayload = {
      success: false,
      message: "Failed to generate sound effect.",
      data: null,
      error: { details: errorMessage },
    };
    const parsedError = ApiErrorResponseSchema.safeParse(errorPayload);

    if (!parsedError.success) {
      console.error(
        "[ElevenLabsController] Failed to parse standard error response:",
        parsedError.error,
      );
      res.status(500).json({
        success: false,
        message:
          "An internal error occurred, and error details could not be formatted.",
      });
    } else {
      res.status(500).json(parsedError.data);
    }
  }
}

/**
 * Controller for handling Voice Changer requests (accepting Audio URL).
 */
export async function handleVoiceChanger(
  req: Request<Record<string, never>, any, VoiceChangerUrlRequest>,
  res: Response,
) {
  console.log(
    "[ElevenLabsController] Received request for Voice Changer (URL)",
  );
  try {
    // Access JSON body directly (validated by middleware)
    const {
      apiKey,
      voiceId,
      audioUrl,
      modelId,
      voiceSettings, // Should be an object directly from JSON
      ...otherOptions // Contains removeBackgroundNoise, optimizeStreamingLatency, seed etc.
    } = req.body;

    // Call the new service method that handles URL download
    // We expect this method to exist after the next step
    const result: AudioResult = await elevenLabsService.convertVoiceFromUrl(
      apiKey,
      voiceId,
      audioUrl,
      {
        // Pass options directly
        modelId,
        voiceSettings,
        ...otherOptions,
      },
    );

    // Response parsing
    const responsePayload = SuccessResponseSchema(AudioResultDataSchema).parse({
      success: true,
      message: null,
      data: result,
    });
    console.log(
      "[ElevenLabsController] Voice Changer (URL) successful, sending response",
    );
    return res.json(responsePayload);
  } catch (error: unknown) {
    // Error handling (using safeParse)
    console.error(
      "[ElevenLabsController] Error in handleVoiceChanger (URL):",
      error,
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during voice conversion from URL.";
    const errorPayload = {
      success: false,
      message: "Failed to convert voice from URL.",
      data: null,
      error: { details: errorMessage },
    };
    const parsedError = ApiErrorResponseSchema.safeParse(errorPayload);

    if (!parsedError.success) {
      console.error(
        "[ElevenLabsController] Failed to parse standard error response:",
        parsedError.error,
      );
      return res.status(500).json({
        success: false,
        message:
          "An internal error occurred, and error details could not be formatted.",
      });
    } else {
      return res.status(500).json(parsedError.data);
    }
  }
}
